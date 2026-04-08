# route-optimizer/backend

для менеджмента зависимостей и т.д. используется `uv`: [https://docs.astral.sh/uv/getting-started/installation/](https://docs.astral.sh/uv/getting-started/installation/)

## Установка зависимостей

```sh
uv sync
```

Чтобы добавить новую зависимость: `uv add <dep>`

## Запуск

```sh
uv run fastapi dev
```
