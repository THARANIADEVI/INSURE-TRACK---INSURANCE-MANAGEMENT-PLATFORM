import logging

from models import db
from models.notification import Notification

logger = logging.getLogger("notifications")


def send_notification(user_id, channel, subject, message):
    """Mock notification sender: logs the send and records it so it can be viewed in-app.

    No real SMTP/SMS provider is configured for this project, so this stands in for
    Flask-Mail / an SMS gateway per the doc's "mock implementation" guidance.
    """
    if user_id is None:
        return None
    logger.info("[MOCK %s] to user %s: %s - %s", channel.upper(), user_id, subject, message)
    notification = Notification(user_id=user_id, channel=channel, subject=subject, message=message)
    db.session.add(notification)
    return notification
