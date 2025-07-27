from fastapi import FastAPI
from fastapi_utils.tasks import repeat_every
from contextlib import asynccontextmanager
from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield  # continue app
    # (optional: cleanup code after yield)

app = FastAPI(lifespan=lifespan)
app.include_router(router, prefix="/api")  # 👈 Pass the router as first arg
