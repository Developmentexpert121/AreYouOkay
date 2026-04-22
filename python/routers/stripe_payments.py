from fastapi import APIRouter, Depends, Request, HTTPException
from typing import Optional
import stripe
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import database, models

import pathlib
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

router = APIRouter(prefix="/stripe", tags=["stripe"])


@router.post("/create-checkout-session")
async def create_checkout_session(user_id: int, request: Request, plan: str = "monthly", origin: Optional[str] = None, db: Session = Depends(database.get_db)):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Create or reuse stripe customer
        customer_id = user.stripe_customer_id
        
        if customer_id:
            try:
                # Verify customer exists in the current account
                stripe.Customer.retrieve(customer_id)
            except stripe.error.InvalidRequestError:
                # Customer not found in this account (likely account changed)
                customer_id = None

        if not customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={"user_id": str(user_id)}
            )
            customer_id = customer.id
            user.stripe_customer_id = customer_id
            db.commit()

        # Build the base URL
        if origin:
            base_url = origin.rstrip('/')
        else:
            scheme = request.url.scheme
            host = request.headers.get("host")
            base_url = f"{scheme}://{host}"

        if plan == "annual":
            unit_amount = 5000  # $50.00 USD
            plan_name = 'r u good? - Annual Subscription'
            interval = 'year'
        else:
            unit_amount = 699   # $6.99 USD
            plan_name = 'r u good? - Monthly Subscription'
            interval = 'month'

        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': plan_name,
                        },
                        'unit_amount': unit_amount,
                        'recurring': {
                            'interval': interval,
                        },
                    },
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f'{base_url}/subscription?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{base_url}/subscription',
            client_reference_id=str(user_id),
            metadata={"plan": plan} # Save plan type in metadata
        )
        return {"id": checkout_session.id, "url": checkout_session.url}
    except Exception as e:
        print(f"[Stripe] Checkout error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/verify-session")
async def verify_session(session_id: str, db: Session = Depends(database.get_db)):
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            user_id = session.client_reference_id
            user = db.query(models.User).filter(models.User.id == int(user_id)).first()
            if user:
                user.subscription_status = "active"
                user.plan_type = session.metadata.get("plan", "monthly")
                if session.subscription:
                    user.stripe_subscription_id = session.subscription
                db.commit()
                db.refresh(user)
                return {"status": "success", "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "subscription_status": user.subscription_status,
                    "plan_type": user.plan_type
                }}
        return {"status": "pending"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel-subscription")
async def cancel_subscription(user_id: int, db: Session = Depends(database.get_db)):
    """Cancel the user's active Stripe subscription immediately."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        if user.stripe_subscription_id:
            try:
                stripe.Subscription.cancel(user.stripe_subscription_id)
            except Exception as stripe_e:
                print(f"[Stripe] Error cancelling subscription: {stripe_e}")

        user.subscription_status = "inactive"
        user.stripe_subscription_id = None
        db.commit()
        db.refresh(user)
        return {"status": "cancelled", "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "subscription_status": user.subscription_status
        }}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(database.get_db)):
    """
    Handles Stripe webhook events to keep subscription status in sync.
    Set STRIPE_WEBHOOK_SECRET in .env (from Stripe Dashboard > Webhooks).
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        else:
            # Dev mode: parse without signature verification
            import json
            event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "customer.subscription.deleted":
        # Subscription cancelled
        subscription_id = data_object.get("id")
        user = db.query(models.User).filter(
            models.User.stripe_subscription_id == subscription_id
        ).first()
        if user:
            user.subscription_status = "inactive"
            db.commit()
            print(f"[Stripe] Subscription cancelled for user {user.email}")

    elif event_type == "customer.subscription.updated":
        subscription_id = data_object.get("id")
        new_status = data_object.get("status")  # active, past_due, canceled, etc.
        user = db.query(models.User).filter(
            models.User.stripe_subscription_id == subscription_id
        ).first()
        if user:
            if new_status == "active":
                user.subscription_status = "active"
            elif new_status in ("past_due", "unpaid", "canceled", "incomplete_expired"):
                user.subscription_status = "inactive"
            db.commit()
            print(f"[Stripe] Subscription updated to '{new_status}' for user {user.email}")

    elif event_type == "invoice.payment_failed":
        customer_id = data_object.get("customer")
        user = db.query(models.User).filter(
            models.User.stripe_customer_id == customer_id
        ).first()
        if user:
            user.subscription_status = "inactive"
            db.commit()
            print(f"[Stripe] Payment failed for user {user.email}, subscription set inactive")

    elif event_type == "checkout.session.completed":
        session = data_object
        if session.get("payment_status") == "paid":
            user_id = session.get("client_reference_id")
            subscription_id = session.get("subscription")
            if user_id:
                user = db.query(models.User).filter(models.User.id == int(user_id)).first()
                if user:
                    user.subscription_status = "active"
                    user.plan_type = session.get("metadata", {}).get("plan", "monthly")
                    if subscription_id:
                        user.stripe_subscription_id = subscription_id
                    db.commit()
                    print(f"[Stripe] Checkout completed and subscription activated for user {user.email} (Plan: {user.plan_type})")

    return {"received": True}
