from uuid import UUID
from typing import Optional
from pydantic import Field
from app.database_models.board_member import RoleEnum
from app.db.base import BaseSchema


class MemberWrite(BaseSchema):
    user_id: UUID = Field(description="User ID to add as a member")
    role: Optional[RoleEnum] = Field(
        default=RoleEnum.member, description="Role of the user in the board"
    )


class MemberRead(BaseSchema):
    user_id: UUID = Field(description="User ID of the member")
    role: RoleEnum = Field(description="Role of the user in the board")
