import asyncio
from typing import List, Dict, Any, Callable
import json
from datetime import datetime, timezone

class EventBus:
    """
    Lightweight, high-performance in-memory pub-sub event bus.
    Can be seamlessly backed by Redis Streams in high-throughput production clusters.
    """
    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []
        self._history: List[Dict[str, Any]] = []
        self._max_history: int = 1000

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

    async def publish(self, event_type: str, data: Dict[str, Any]):
        message = {
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": data
        }
        # Maintain rolling in-memory history for quick reconnects
        self._history.append(message)
        if len(self._history) > self._max_history:
            self._history.pop(0)

        dead_queues = []
        for q in self._subscribers:
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                # Remove slow consumers if queue overflowed
                dead_queues.append(q)
            except Exception:
                dead_queues.append(q)

        for q in dead_queues:
            self.unsubscribe(q)

    def get_recent_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._history[-limit:]

event_bus = EventBus()
