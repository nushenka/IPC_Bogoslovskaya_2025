from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Protocol
from abc import ABC, abstractmethod
import random

@dataclass
class Economy:
    inflation: float
    interest_rate: float
    tax_rate: float
    global_demand_index: float

    def apply_inflation(self, value: float) -> float:
        return value * (1 + self.inflation)

    def update_interest_rate(self, delta: float) -> None:
        self.interest_rate += delta
