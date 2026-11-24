from fastapi import APIRouter, Depends
from app.core.deps import AuthContext, get_current_user
from app.services.attack_graph_service import attack_graph_service

router = APIRouter(prefix="/attack-graph", tags=["Attack Graph Topology"])

@router.get("")
def get_attack_graph(auth: AuthContext = Depends(get_current_user)):
    return attack_graph_service.generate_graph()
