from core.mongo import Collections, col


def has_purchased(user_id, payable_type: str, ref_id) -> bool:
    return (
        col(Collections.PAYMENTS).find_one(
            {"user_id": user_id, "type": payable_type, "ref_id": ref_id, "status": "succeeded"}
        )
        is not None
    )
