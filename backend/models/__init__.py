from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User  # noqa: E402,F401
from .customer import Customer  # noqa: E402,F401
from .policy import Policy  # noqa: E402,F401
from .claim import Claim  # noqa: E402,F401
from .premium_payment import PremiumPayment  # noqa: E402,F401
from .document import Document  # noqa: E402,F401
from .audit_log import AuditLog  # noqa: E402,F401
from .notification import Notification  # noqa: E402,F401
from .setting import Setting  # noqa: E402,F401
