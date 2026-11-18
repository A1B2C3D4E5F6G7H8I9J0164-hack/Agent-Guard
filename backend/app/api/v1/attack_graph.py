from fastapi import APIRouter
from app.services.attack_graph_service import attack_graph_service

router = APIRouter(prefix="/attack-graph", tags=["Attack Graph Topology"])

@router.get("")
def get_attack_graph():
    return attack_graph_service.generate_graph()
