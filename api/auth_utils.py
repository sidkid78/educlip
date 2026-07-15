from fastapi import HTTPException, Request, status

def get_current_tenant(request: Request):
    """
    Dependency to extract and enforce tenant session context.
    Ensures both user_id and org_id are successfully extracted by Clerk middleware.
    """
    if not hasattr(request.state, "org_id") or not request.state.org_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized tenant session context. Missing Organization identification."
        )
    return {
        "user_id": request.state.user_id,
        "org_id": request.state.org_id
    }
