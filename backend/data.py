"""Seed data extracted from the Excel file 'Данные по маршрутам.xlsx'."""

from models import (
    CurrencyType,
    Location,
    PointType,
    Route,
    RouteLeg,
    TransportType,
)

USD_RATE = 92.0  # RUB per USD, configurable

LOCATIONS: list[Location] = [
    Location(id="ryazan", name="Рязань", lat=54.6269, lng=39.6916, point_type=PointType.CITY, country="Россия"),
    Location(id="novorossiysk", name="Новороссийск", lat=44.7234, lng=37.7687, point_type=PointType.PORT, country="Россия"),
    Location(id="baltic", name="Балтийский порт", lat=59.9139, lng=29.7650, point_type=PointType.PORT, country="Россия"),
    Location(id="transit_port", name="Транзитный порт", lat=31.2304, lng=29.9187, point_type=PointType.PORT, country="Транзит"),
    Location(id="nhava_sheva", name="Нава Шева", lat=18.9500, lng=72.9500, point_type=PointType.PORT, country="Индия"),
]

ROUTES: list[Route] = [
    # Route A: Ryazan -> Novorossiysk -> Nhava Sheva (Rail)
    Route(
        id="A",
        name="A: Рязань–Новороссийск–Нава Шева (Ж/Д)",
        origin_id="ryazan",
        destination_id="nhava_sheva",
        legs=[
            RouteLeg(
                id="A1", route_id="A", transport_type=TransportType.RAIL,
                label="Ж/д", origin="Рязань", destination="Новороссийск",
                distance_km=1500, cost_per_ton=4050, currency=CurrencyType.RUB,
                duration_days=11, cost_min=3450, cost_max=4800,
                duration_min=10, duration_max=12,
            ),
            RouteLeg(
                id="A2", route_id="A", transport_type=TransportType.PORT_SERVICES,
                label="Перевалка в Новороссийске", origin="Новороссийск", destination="Новороссийск",
                distance_km=0, cost_per_ton=30, currency=CurrencyType.USD,
                duration_days=5, cost_min=25, cost_max=35,
                duration_min=3, duration_max=7,
            ),
            RouteLeg(
                id="A3", route_id="A", transport_type=TransportType.SEA,
                label="Морской фрахт", origin="Новороссийск", destination="Нава Шева",
                distance_km=7000, cost_per_ton=90, currency=CurrencyType.USD,
                duration_days=22, cost_min=70, cost_max=130,
                duration_min=17, duration_max=25,
            ),
        ],
    ),
    # Route B: Ryazan -> Novorossiysk -> Nhava Sheva (Truck)
    Route(
        id="B",
        name="B: Рязань–Новороссийск–Нава Шева (Авто)",
        origin_id="ryazan",
        destination_id="nhava_sheva",
        legs=[
            RouteLeg(
                id="B1", route_id="B", transport_type=TransportType.TRUCK,
                label="Авто", origin="Рязань", destination="Новороссийск",
                distance_km=1500, cost_per_ton=9600, currency=CurrencyType.RUB,
                duration_days=3, cost_min=8800, cost_max=10400,
                duration_min=2, duration_max=4,
            ),
            RouteLeg(
                id="B2", route_id="B", transport_type=TransportType.PORT_SERVICES,
                label="Перевалка в Новороссийске", origin="Новороссийск", destination="Новороссийск",
                distance_km=0, cost_per_ton=20, currency=CurrencyType.USD,
                duration_days=5, cost_min=15, cost_max=25,
                duration_min=3, duration_max=7,
            ),
            RouteLeg(
                id="B3", route_id="B", transport_type=TransportType.SEA,
                label="Морской фрахт", origin="Новороссийск", destination="Нава Шева",
                distance_km=7000, cost_per_ton=90, currency=CurrencyType.USD,
                duration_days=22, cost_min=70, cost_max=130,
                duration_min=17, duration_max=25,
            ),
        ],
    ),
    # Route C: Ryazan -> Baltic -> Transit -> India (Rail)
    Route(
        id="C",
        name="C: Рязань–Балтика–транзит–Индия (Ж/Д)",
        origin_id="ryazan",
        destination_id="nhava_sheva",
        legs=[
            RouteLeg(
                id="C1", route_id="C", transport_type=TransportType.RAIL,
                label="Ж/д", origin="Рязань", destination="Балтийский порт",
                distance_km=1050, cost_per_ton=2835, currency=CurrencyType.RUB,
                duration_days=8, cost_min=2415, cost_max=3360,
                duration_min=9, duration_max=10,
            ),
            RouteLeg(
                id="C2", route_id="C", transport_type=TransportType.PORT_SERVICES,
                label="Перевалка в Балтийском порту", origin="Балтийский порт", destination="Балтийский порт",
                distance_km=0, cost_per_ton=25, currency=CurrencyType.USD,
                duration_days=4, cost_min=22, cost_max=30,
                duration_min=3, duration_max=7,
            ),
            RouteLeg(
                id="C3", route_id="C", transport_type=TransportType.SEA,
                label="Морской фрахт", origin="Балтийский порт", destination="Транзитный порт",
                distance_km=5500, cost_per_ton=65, currency=CurrencyType.USD,
                duration_days=20, cost_min=50, cost_max=80,
                duration_min=16, duration_max=22,
            ),
            RouteLeg(
                id="C4", route_id="C", transport_type=TransportType.TRANSIT,
                label="Перевалка в транзитном порту", origin="Транзитный порт", destination="Транзитный порт",
                distance_km=0, cost_per_ton=12, currency=CurrencyType.USD,
                duration_days=4, cost_min=8, cost_max=15,
                duration_min=3, duration_max=7,
            ),
            RouteLeg(
                id="C5", route_id="C", transport_type=TransportType.FEEDER,
                label="Морской фрахт (фидер)", origin="Транзитный порт", destination="Нава Шева",
                distance_km=2500, cost_per_ton=35, currency=CurrencyType.USD,
                duration_days=10, cost_min=25, cost_max=40,
                duration_min=7, duration_max=15,
            ),
        ],
    ),
    # Route D: Ryazan -> Baltic -> Transit -> India (Truck)
    Route(
        id="D",
        name="D: Рязань–Балтика–транзит–Индия (Авто)",
        origin_id="ryazan",
        destination_id="nhava_sheva",
        legs=[
            RouteLeg(
                id="D1", route_id="D", transport_type=TransportType.TRUCK,
                label="Авто", origin="Рязань", destination="Балтийский порт",
                distance_km=1050, cost_per_ton=6720, currency=CurrencyType.RUB,
                duration_days=2, cost_min=6400, cost_max=7200,
                duration_min=2, duration_max=3,
            ),
            RouteLeg(
                id="D2", route_id="D", transport_type=TransportType.PORT_SERVICES,
                label="Перевалка в Балтийском порту", origin="Балтийский порт", destination="Балтийский порт",
                distance_km=0, cost_per_ton=25, currency=CurrencyType.USD,
                duration_days=4, cost_min=22, cost_max=30,
                duration_min=3, duration_max=7,
            ),
            RouteLeg(
                id="D3", route_id="D", transport_type=TransportType.SEA,
                label="Морской фрахт", origin="Балтийский порт", destination="Транзитный порт",
                distance_km=5500, cost_per_ton=65, currency=CurrencyType.USD,
                duration_days=20, cost_min=50, cost_max=80,
                duration_min=16, duration_max=22,
            ),
            RouteLeg(
                id="D4", route_id="D", transport_type=TransportType.TRANSIT,
                label="Перевалка в транзитном порту", origin="Транзитный порт", destination="Транзитный порт",
                distance_km=0, cost_per_ton=12, currency=CurrencyType.USD,
                duration_days=4, cost_min=8, cost_max=15,
                duration_min=3, duration_max=7,
            ),
            RouteLeg(
                id="D5", route_id="D", transport_type=TransportType.FEEDER,
                label="Морской фрахт (фидер)", origin="Транзитный порт", destination="Нава Шева",
                distance_km=2500, cost_per_ton=35, currency=CurrencyType.USD,
                duration_days=10, cost_min=25, cost_max=40,
                duration_min=7, duration_max=15,
            ),
        ],
    ),
]
