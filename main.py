from fastapi import FastAPI

app = FastAPI()

@app.get("/hellothere")
async def hellothere():
  return {"hello there": "general Kenobi"}
