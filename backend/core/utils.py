import random
import string

from bson import ObjectId
from bson.errors import InvalidId
from rest_framework.exceptions import ValidationError


def to_object_id(value) -> ObjectId:
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        raise ValidationError({"detail": "Invalid id."})


def oid_str(value) -> str | None:
    if value is None:
        return None
    return str(value)


def serialize_doc(doc: dict | None) -> dict | None:
    """Convert a Mongo document into a JSON-friendly dict: _id -> id (str),
    and stringify any *_id / *_ids ObjectId fields."""
    if doc is None:
        return None
    out = dict(doc)
    if "_id" in out:
        out["id"] = oid_str(out.pop("_id"))
    for key, value in list(out.items()):
        if isinstance(value, ObjectId):
            out[key] = str(value)
        elif isinstance(value, list) and value and all(isinstance(v, ObjectId) for v in value):
            out[key] = [str(v) for v in value]
    return out


def serialize_many(docs) -> list:
    return [serialize_doc(d) for d in docs]


def generate_code(length: int = 10) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=length))
