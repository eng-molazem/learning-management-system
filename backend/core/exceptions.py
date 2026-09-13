from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None and isinstance(response.data, dict) and "detail" not in response.data:
        # Flatten field-error dicts into a single readable message while keeping the raw errors.
        response.data = {"detail": "Validation error.", "errors": response.data}
    return response
