from recipe_scrapers import scrape_me
from ingredient_parser import parse_ingredient

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
        self.scraper = scrape_me(url)

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