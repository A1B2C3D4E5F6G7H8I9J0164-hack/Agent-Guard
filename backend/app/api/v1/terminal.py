from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.core.database import SessionLocal
from app.core.deps import AuthContext, authenticate_websocket, get_current_user
from app.schemas.schemas import TerminalCommandRequest, TerminalCommandResponse
from app.cli.runner import agentguard_cli

router = APIRouter(prefix="/terminal", tags=["Developer Terminal"])

@router.post("/execute", response_model=TerminalCommandResponse)
def execute_terminal_command(
    req: TerminalCommandRequest,
    auth: AuthContext = Depends(get_current_user),
):
    res = agentguard_cli.execute(req.command)
    return {
        "command": req.command,
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "exit_code": res["exit_code"],
        "format": "ansi"
    }

@router.websocket("/ws")
async def terminal_websocket(websocket: WebSocket):
    """
    Bidirectional streaming WebSocket session for xterm.js terminal.
    Requires valid JWT or API key via query param (`?token=...`) or header.
    """
    db = SessionLocal()
    try:
        auth = await authenticate_websocket(websocket, db)
    finally:
        db.close()

    if not auth:
        return

    await websocket.accept()
    # Send banner
    welcome = "\x1b[1;32mAgentGuard Interactive Security Terminal\x1b[0m (v1.0.0)\r\nType '\x1b[36mhelp\x1b[0m' for available commands.\r\n\r\nagentguard> "
    await websocket.send_text(welcome)

    try:
        while True:
            cmd = await websocket.receive_text()
            cmd_clean = cmd.strip()
            if cmd_clean:
                res = agentguard_cli.execute(cmd_clean)
                output = res["stdout"] or ""
                if res["stderr"]:
                    output += res["stderr"]
                await websocket.send_text(output + "\r\nagentguard> ")
            else:
                await websocket.send_text("agentguard> ")
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
