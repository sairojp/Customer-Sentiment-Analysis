import pandas as pd
import enchant
import re
import contractions
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

# Initialize the English dictionary using Enchant
english_dict = enchant.Dict("en_US")

#  check if a word is English using Enchant
def is_english(word):
    return english_dict.check(word)

# expand contractions in English text
def expand_contractions(text):
    return contractions.fix(text)

# check if a word is all uppercase
def is_uppercase(word):
    return word.isupper()

# Filter out texts with more than 80% English words
def is_mostly_english(text, threshold=0.8):
    words = re.findall(r'\b\w+\b', text)  
    if not words:
        return False  
    
    english_count = sum(1 for word in words if is_english(word))
    english_ratio = english_count / len(words)
    
    return english_ratio > threshold

# Function to transliterate Romanized Nepali to Nepali script
def transliterate_to_nepali(romanized_text):
    if not romanized_text:
        return ""  
    
    # Step 1: Expand English contractions 
    romanized_text = expand_contractions(romanized_text)

    # Step 2: Regex to split the text into words and punctuation 
    words_and_punctuations = re.findall(r'\w+|[^\w\s]', romanized_text, re.UNICODE)
    
    result = []
    
    for i, item in enumerate(words_and_punctuations):
        # If the item is a word and is English,  otherwise transliterate
        if is_english(item):
            result.append(item)
        elif item.lower() in ["vianet", "worldlink"]:
           
            result.append(item)
        elif is_uppercase(item):
            result.append(item)
        else:
            # Change 'x' to 'ch' for better transliteration 
            item = item.replace('x', 'ch')
            try:
                # Transliterate Romanized Nepali to Nepali script
                nepali_word = transliterate(item, sanscript.IAST, sanscript.DEVANAGARI)
                result.append(nepali_word)
            except Exception as e:
                print(f"Error with transliteration for word {item}: {e}")
                result.append(item)  # If error, keep the original word

        #space between words unless the next item is punctuation
        if i < len(words_and_punctuations) - 1 and re.match(r'\w+', words_and_punctuations[i+1]):
            result.append(" ")

    return ''.join(result)

input_file = 'DataCollection\scraped_data\comments.csv' 
output_file = 'DataCollection/filtered_data/worldlink_yt_mixed.csv' 

df = pd.read_csv(input_file)

if 'Review' not in df.columns:
    print("Error: 'Review' column not found in the CSV.")
else:
    # 'Review' column to string and remove NaN values
    df["Review"] = df["Review"].astype(str).fillna("")
    
    # Filter out reviews with more than 80% English words
    df_english = df[df["Review"].apply(is_mostly_english)]

    df_filtered = df[~df["Review"].apply(is_mostly_english)]

    # Apply transliteration to filtered data
    df_filtered['review_nepali'] = df_filtered["Review"].apply(transliterate_to_nepali)

  

    df_english.to_csv('DataCollection/filtered_data/worldlink_yt_english.csv', index=False) 

      # Save the filtered dataset

    df_filtered.to_csv(output_file, index=False)

    print(f"Filtered and transliterated reviews have been saved to '{output_file}'.")
