class InvalidTokenError(Exception):
    pass


class ExpiredTokenError(Exception):
    pass


class RateLimitError(Exception):
    pass


class EmailDeliveryError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class EmailNotVerifiedError(Exception):
    pass


class AccountInactiveError(Exception):
    pass


class TokenOwnershipError(Exception):
    pass


class InvalidRefreshTokenError(Exception):
    pass
