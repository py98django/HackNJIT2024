import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from urllib.parse import quote
import os
import time
import logging
from PIL import Image
from io import BytesIO
import hashlib
from typing import List, Dict, Optional
import concurrent.futures
import re

class ImageScraper:
    def __init__(self, download_path: str = "downloaded_images"):
        """
        Initialize the image scraper with configuration
        
        Args:
            download_path (str): Path to store downloaded images
        """
        self.download_path = download_path
        self.setup_logging()
        self.setup_chrome_options()
        
        # Create download directory if it doesn't exist
        if not os.path.exists(download_path):
            os.makedirs(download_path)

    def setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def setup_chrome_options(self):
        """Configure Chrome options for headless browsing"""
        self.chrome_options = Options()
        self.chrome_options.add_argument('--headless')
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        self.chrome_options.add_argument('--disable-gpu')
        self.chrome_options.add_argument('--window-size=1920x1080')

    def get_image_urls(self, keyword: str, num_images: int = 10) -> List[str]:
        """
        Fetch image URLs from Google Images
        
        Args:
            keyword (str): Search term
            num_images (int): Number of images to fetch
            
        Returns:
            List[str]: List of image URLs
        """
        self.logger.info(f"Searching for '{keyword}' images...")
        
        # Format the Google Images URL
        search_url = f"https://www.google.com/search?q={quote(keyword)}&tbm=isch"
        
        try:
            driver = webdriver.Chrome(options=self.chrome_options)
            driver.get(search_url)
            
            image_urls = []
            last_height = driver.execute_script("return document.body.scrollHeight")
            
            while len(image_urls) < num_images:
                # Scroll down
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                
                # Get image elements
                thumbnails = driver.find_elements(By.CSS_SELECTOR, "img.rg_i")
                
                # Click each thumbnail to get full resolution image
                for thumbnail in thumbnails:
                    if len(image_urls) >= num_images:
                        break
                        
                    try:
                        thumbnail.click()
                        time.sleep(1)
                        
                        # Wait for full resolution image
                        WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, "img.n3VNCb"))
                        )
                        
                        # Get full resolution image URL
                        actual_images = driver.find_elements(By.CSS_SELECTOR, "img.n3VNCb")
                        for img in actual_images:
                            src = img.get_attribute('src')
                            if src and src.startswith('http') and src not in image_urls:
                                image_urls.append(src)
                                break
                                
                    except Exception as e:
                        self.logger.warning(f"Error processing thumbnail: {str(e)}")
                        continue
                
                # Check if we've reached the end of the page
                new_height = driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
                
            driver.quit()
            return image_urls[:num_images]
            
        except Exception as e:
            self.logger.error(f"Error in get_image_urls: {str(e)}")
            if 'driver' in locals():
                driver.quit()
            return []

    def is_good_quality(self, image_data: bytes, min_width: int = 800, min_height: int = 600) -> bool:
        """
        Check if image meets quality requirements
        
        Args:
            image_data (bytes): Image data
            min_width (int): Minimum width requirement
            min_height (int): Minimum height requirement
            
        Returns:
            bool: True if image meets quality requirements
        """
        try:
            img = Image.open(BytesIO(image_data))
            width, height = img.size
            return width >= min_width and height >= min_height
        except Exception as e:
            self.logger.warning(f"Error checking image quality: {str(e)}")
            return False

    def download_image(self, url: str) -> Optional[Dict]:
        """
        Download a single image from URL
        
        Args:
            url (str): Image URL
            
        Returns:
            Optional[Dict]: Image information if successful
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Check image quality
            if not self.is_good_quality(response.content):
                return None
                
            # Generate unique filename using hash of image content
            image_hash = hashlib.md5(response.content).hexdigest()
            file_extension = self.get_file_extension(response.headers.get('content-type', ''))
            filename = f"{image_hash}{file_extension}"
            filepath = os.path.join(self.download_path, filename)
            
            # Save image
            with open(filepath, 'wb') as f:
                f.write(response.content)
                
            return {
                'filename': filename,
                'filepath': filepath,
                'url': url,
                'size': len(response.content)
            }
            
        except Exception as e:
            self.logger.warning(f"Error downloading image from {url}: {str(e)}")
            return None

    def get_file_extension(self, content_type: str) -> str:
        """Get file extension from content type"""
        extensions = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp'
        }
        return extensions.get(content_type.lower(), '.jpg')

    def fetch_images(self, keyword: str, num_images: int = 10) -> List[Dict]:
        """
        Main method to fetch and download images
        
        Args:
            keyword (str): Search term
            num_images (int): Number of images to fetch
            
        Returns:
            List[Dict]: List of successfully downloaded images
        """
        self.logger.info(f"Starting image fetch for '{keyword}'")
        
        # Get image URLs
        urls = self.get_image_urls(keyword, num_images * 2)  # Get extra URLs in case some fail
        
        # Download images in parallel
        downloaded_images = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_url = {executor.submit(self.download_image, url): url for url in urls}
            for future in concurrent.futures.as_completed(future_to_url):
                result = future.result()
                if result:
                    downloaded_images.append(result)
                if len(downloaded_images) >= num_images:
                    break
                    
        self.logger.info(f"Successfully downloaded {len(downloaded_images)} images for '{keyword}'")
        return downloaded_images[:num_images]

def main():
    # Example usage
    scraper = ImageScraper(download_path="steampunk")
    images = scraper.fetch_images(
    keyword="steampunk simple images",
    num_images=10
)  
    for img in images:
        print(f"Downloaded: {img['filename']} ({img['size']} bytes)")

if __name__ == "__main__":
    main()