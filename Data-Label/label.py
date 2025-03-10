import pandas as pd
import ollama

def get_sentiment(review, model="llama3.2:latest"):
    """Get sentiment label (1: satisfied, 0: disatisfied , 2: neutral) using Llama3."""
    prompt = f"""
    Analyze the sentiment of the following review and respond with only '1' if the reviewer is satisfied with the product and conveys a positive message or '0' if the reviewer is disatisfied and frustrated with the product and conveys a negative message or '2' if the reviewer is neither disatisfied or satisfied with generic question or conversation:
    """
    response = ollama.chat(model=model, messages=[{"role": "user", "content": prompt + review}])
    sentiment = response["message"]["content"].strip()
    return int(sentiment) if sentiment in ['0', '1','2'] else None

def label_reviews(csv_file, output_file):
    """Label reviews in a CSV file and save results."""
    df = pd.read_csv(csv_file)

    if "Review" not in df.columns:
        raise ValueError("CSV must have a 'review' column")
    
    df["sentiment"] = df["Review"].apply(get_sentiment)
    df.to_csv(output_file, index=False)
    print(f"Labeled dataset saved to {output_file}")

if __name__ == "__main__":
    input_csv = "DataCollection\\filtered_data\\worldlink_yt_mixed2.csv"  
    output_csv = "DataCollection/Labelled_data/yt_worldlink_mixed_labelled.csv"
    label_reviews(input_csv, output_csv)