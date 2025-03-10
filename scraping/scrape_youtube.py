import googleapiclient.discovery
import googleapiclient.errors
import time
import csv

# Google API key
api_key = ''

# Channel ID of the YouTube channel 
channel_id = ''


def get_video_ids(channel_id, api_key):
    try:
        youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=api_key)
        video_ids = []
        next_page_token = None

        while True:
            request = youtube.search().list(
                part="snippet",
                channelId=channel_id,
                maxResults=50, 
                pageToken=next_page_token
            )
            response = request.execute()

            for item in response['items']:
                if item['id']['kind'] == 'youtube#video':
                    video_ids.append(item['id']['videoId'])

            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break

        return video_ids

    except googleapiclient.errors.HttpError as e:
        print(f"HTTP error occurred: {e}")
        return []
    except Exception as e:
        print(f"An error occurred while getting video IDs: {e}")
        return []


def get_comments(video_id, api_key):
    try:
        youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=api_key)
        comments = []
        next_page_token = None

        while True:
            request = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                textFormat="plainText",
                pageToken=next_page_token
            )
            response = request.execute()

            for item in response['items']:
                comment_text = item['snippet']['topLevelComment']['snippet']['textDisplay']
                commenter_name = item['snippet']['topLevelComment']['snippet']['authorDisplayName']
                comment_date = item['snippet']['topLevelComment']['snippet']['publishedAt']
                comments.append([comment_text, commenter_name, comment_date])

            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break

        return comments

    except googleapiclient.errors.HttpError as e:
        print(f"HTTP error occurred while fetching comments: {e}")
        return []
    except Exception as e:
        print(f"An error occurred while getting comments for video {video_id}: {e}")
        return []

# Main function to scrape all comments from the channel's videos
def scrape_channel_comments(channel_id, api_key):
    try:
        video_ids = get_video_ids(channel_id, api_key)
        if not video_ids:
            print("No videos found.")
            return []

        all_comments = []

        # Fetch channel name (for reference)
        youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=api_key)
        channel_request = youtube.channels().list(
            part="snippet",
            id=channel_id
        )
        channel_response = channel_request.execute()
        channel_name = channel_response['items'][0]['snippet']['title']

        for video_id in video_ids:
            print(f"Fetching comments for video: {video_id}")
            comments = get_comments(video_id, api_key)

            if not comments:
                print(f"No comments found for video {video_id}")
                continue

            # Get video title (for reference)
            video_request = youtube.videos().list(
                part="snippet",
                id=video_id
            )
            video_response = video_request.execute()
            video_title = video_response['items'][0]['snippet']['title']

            for comment in comments:
                all_comments.append([channel_name, video_title] + comment)

            time.sleep(1)  #  avoid hitting API rate limits

        return all_comments

    except googleapiclient.errors.HttpError as e:
        print(f"HTTP error occurred while fetching channel or video data: {e}")
        return []
    except Exception as e:
        print(f"An error occurred while scraping comments: {e}")
        return []

#  write to CSV
def write_comments_to_csv(comments, filename="comment_vianet.csv"):
    try:
        # Write to CSV file
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Channel Name', 'Video Name', 'Comment Text', 'Commenter Name', 'Date/Time']
            writer = csv.writer(csvfile)
            writer.writerow(fieldnames) 

            for comment in comments:
                writer.writerow(comment)

        print(f"Comments have been saved to {filename}")
    except Exception as e:
        print(f"An error occurred while writing comments to CSV: {e}")

if __name__ == "__main__":
    all_comments = scrape_channel_comments(channel_id, api_key)

    if all_comments:
        write_comments_to_csv(all_comments)

    print("Comments scraping complete.")
