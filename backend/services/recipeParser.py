from recipe_scrapers import scrape_me, scrape_html
from ingredient_parser import parse_ingredient
import requests

CUSTOM_UNITS = [
    "sac", "sacs", "bunch", "bunches", "sprig", "sprigs",
    "fillet", "fillets", "slice", "slices", "piece", "pieces",
    "stalk", "stalks", "head", "heads", "clove", "cloves",
    "sheet", "sheets", "block", "blocks", "can", "cans",
    "jar", "jars", "bag", "bags", "package", "packages", "cup"
]


class RecipeParser:

    def __init__(self, url):
        self.url = url
        self.scraper = self._get_scraper()

    def _get_scraper(self):
        # Option 1 — standard scrape_me
        try:
            print(f"[1] Trying standard scrape for: {self.url}")
            scraper = scrape_me(self.url, wild_mode=True)
            scraper.title()  # test if it actually worked
            print("[1] Success")
            return scraper
        except Exception as e:
            print(f"[1] Failed: {type(e).__name__} — {e}")

        # Option 2 — manual request with mobile user agent
        try:
            print(f"[2] Trying with mobile user agent for: {self.url}")
            headers = {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
            }
            response = requests.get(self.url, headers=headers, timeout=10)
            response.raise_for_status()
            scraper = scrape_html(response.text, self.url, wild_mode=True)
            scraper.title()  # test if it actually worked
            print("[2] Success")
            return scraper
        except Exception as e:
            print(f"[2] Failed: {type(e).__name__} — {e}")

            # Both failed
            raise Exception(
                f"Could not parse recipe from {self.url}. "
                f"The site may block scrapers or use an unsupported format."
            )

    def get_metadata(self):
        return {
            "url": self.url,
            "name": None,
            "image": None,
            "servings": None,
            "total_time": None,
        }

    def format_ingredient(self, raw_string):
        parsed = parse_ingredient(raw_string)
        amount = None
        unit = None
        item = raw_string

        if parsed.amount:
            amount = str(parsed.amount[0].quantity)
            unit = str(parsed.amount[0].unit) if parsed.amount[0].unit else None

        if parsed.name:
            item = parsed.name[0].text

        if item:
            words = item.split()
            if words[0].lower() in CUSTOM_UNITS:
                unit = words[0]
                item = " ".join(words[1:])

        return {
            "amount": amount,
            "unit": unit,
            "item": item
        }

    def get_ingredients(self):
        return [self.format_ingredient(i) for i in self.scraper.ingredients()]

    def get_instructions(self):
        steps_raw = self.scraper.instructions().split("\n")
        steps_clean = [step.strip() for step in steps_raw if step.strip()]
        return steps_clean

    def parse(self):
        return {
            **self.get_metadata(),
            "versions": [
                {
                    "id": 1,
                    "tab_name": "Original",
                    "ingredients": self.get_ingredients(),
                    "instructions": self.get_instructions(),
                }
            ]
        }


# Run
if __name__ == "__main__":
    url = "https://www.justonecookbook.com/classic-mentaiko-pasta/"
    parser = RecipeParser(url)
    result = parser.parse()
    print(result)