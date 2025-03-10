from google_play_scraper import reviews_all , Sort
import pandas as pd


def scrape_playstore_reviews(app_id, lang='en', country='np'):
    """
    Scrapes all reviews of a given app from the Google Play Store.
    :param app_id: The package name of the app (e.g., 'com.example.app')
    :param lang: Language of the reviews (default is English 'en')
    :param country: Country of the Play Store (default is 'np')
    :return: DataFrame containing reviews
    """
    try:
        # Scraping all reviews
        reviews = reviews_all(
            app_id = app_id,
            lang=lang, 
            country=country, 
            sort=Sort.MOST_RELEVANT,  
        )

        # Ensure reviews data is a list
        if not isinstance(reviews, list):
            raise ValueError(f"Unexpected data format received from reviews_all: {type(reviews)}")

        if not reviews:
            raise ValueError("No reviews found for the given app.")

        
        df = pd.DataFrame(reviews)
        required_columns = {'userName', 'score', 'at', 'content'}
        available_columns = set(df.columns)

        # Check for missing expected keys
        missing_columns = required_columns - available_columns
        if missing_columns:
            raise ValueError(f"Missing expected keys in reviews data: {missing_columns}")

        df = df[list(required_columns)]
        df.columns = ['User', 'Rating', 'Date', 'Review']


        output_filename = f'{app_id}_reviews.csv'
        df.to_csv(output_filename, index=False, encoding='utf-8')
        print(f"Scraped {len(df)} reviews and saved to {output_filename}")

        return df
    except Exception as e:
        print("Error:", str(e))
        return None



if __name__ == "__main__":
    app_package_name = "np.com.worldlink.worldlinkapp"  
    scrape_playstore_reviews(app_package_name)
