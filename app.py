from fastapi import FastAPI, Request
from pydantic import BaseModel
from transformers import AutoTokenizer, pipeline, AutoModelForSequenceClassification
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

# Initialize FastAPI app
app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Load pre-trained BERT model and tokenizer
model_path = "./Model"
sentiment_analyzer = pipeline("sentiment-analysis", model=model_path)

# Define a Pydantic model to receive text input
class SentimentInput(BaseModel):
    text: str

# Serve the index.html file 
@app.get("/", response_class=HTMLResponse)
async def get_index():
    index_file = "index.html"
    if os.path.exists(index_file):
        with open(index_file, 'r') as f:
            return f.read()
    else:
        return "Index file not found"

# POST endpoint for sentiment analysis
@app.post("/predict/")
async def analyze_sentiment(input: SentimentInput, request: Request):
    # Print incoming request details
    print("\n[DEBUG] Received request:")
    print(f"Headers: {request.headers}")
    print(f"Body: {input.dict()}")

    try:
        #  sentiment analysis result
        result = sentiment_analyzer(input.text)
        if result[0]['label'] == "LABEL_1":
            sentiment = 1
        else:
            sentiment = 0

        return {"sentiment": sentiment, "confidence": result[0]['score']}

    except Exception as e:
        # Log error
        print(f"\n[ERROR] {str(e)}")
        return {"error": "Internal Server Error", "message": str(e)}


app.mount("/static", StaticFiles(directory="static"), name="static")
