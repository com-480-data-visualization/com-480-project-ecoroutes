import requests
from bs4 import BeautifulSoup
import csv
from itertools import combinations, permutations
from tqdm import tqdm
import math
import re

cities = []
with open("data/cities.txt", "r") as file:
    for line in file:
        # Strip new line characters and any leading/trailing whitespace
        city = line.strip()
        if city:  # Check if the line is not empty
            cities.append(city)


def string_to_number(s):
    # Split the string into the integer part and the decimal part
    integer_part = s[:-6]
    decimal_part = s[-6:]

    # Combine the parts into a final number
    result = float(f"{integer_part}.{decimal_part}")

    return result


def download_kml(kml_url, save_path):
    """
    Download a KML file from the specified URL and save it to the given path.

    Args:
    - kml_url (str): The URL of the KML file to download.
    - save_path (str): The file path where the KML should be saved.
    """
    try:
        response = requests.get(kml_url, stream=True)
        if response.status_code == 200:
            with open(save_path, "wb") as file:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:  # filter out keep-alive new chunks
                        file.write(chunk)
        else:
            print(
                f"Failed to download the KML file. Status code: {response.status_code}"
            )
    except Exception as e:
        print(f"An error occurred while downloading the KML file: {e}")


def get_station_info(city_name):
    url = f"https://ecopassenger.hafas.de/bin/ajax-getstop.exe/eny?start=1&getattr=1&tpl=suggest2json&REQ0JourneyStopsS0A=255&getstop=1&noSession=yes&REQ0JourneyStopsB=&REQ0JourneyStopsS0G={city_name}?&js=true&"

    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.text
            start = data.find("{")
            end = data.rfind("}")
            json_str = data[start : end + 1]

            suggestions = eval(json_str)["suggestions"][
                0
            ]  # Using eval here due to the response format

            # Extract 'id' and 'value' from the first suggestion
            station_id = suggestions["id"]
            station_value = suggestions["value"]
            station_coordinates = [
                string_to_number(suggestions["ycoord"]),
                string_to_number(suggestions["xcoord"]),
            ]

            return station_id, station_value, station_coordinates
        else:
            return None, None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None, None


def parse_number(s):
    return float(s.replace(",", "."))


def duration_to_seconds(duration):
    """
    Convert a duration string ("HH:MM") to seconds, assuming the input is hours and minutes.

    Args:
    - duration (str): The duration string to convert.

    Returns:
    - int: The duration in seconds.
    """
    hours, minutes = map(int, duration.split(":"))
    return hours * 3600 + minutes * 60


def seconds_to_duration(seconds):
    """
    Convert seconds to a duration string ("HH:MM"), rounding down to the nearest minute.

    Args:
    - seconds (int): The number of seconds to convert.

    Returns:
    - str: The duration string in "HH:MM" format.
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours:02}:{minutes:02}"


def assign_data(data, key, elements, parse_func, index):
    if index < len(elements):
        data[key] = parse_func(elements[index].text)


def calculate_co2_and_duration(dep, arr):

    dep_id, dep_value, dep_coords = get_station_info(dep)
    arr_id, arr_value, arr_coords = get_station_info(arr)

    # URL to send the POST request to
    url = "https://ecopassenger.hafas.de/bin/query.exe/en?ld=uic-eco&L=vs_uic&protocol=https:&OK"

    # Form data to be sent with POST request
    data = {
        "queryPageDisplayed": "yes",
        "REQComparisonCarload": "0",
        "REQ0Total_KissRide_maxDist": "5555500",
        "REQ0JourneyStopsS0A": "1",
        "REQ0JourneyStopsS0G": dep_value,
        "REQ0JourneyStopsS0ID": dep_id,
        "REQ0JourneyStopsZ0A": "1",
        "REQ0JourneyStopsZ0G": arr_value,
        "REQ0JourneyStopsZ0ID": arr_id,
        "REQ0JourneyDate": "Wed, 01.03.24",  # day
        "wDayExt0": "Mo|Tu|We|Th|Fr|Sa|Su",
        "REQ0JourneyTime": "06:00",
        "REQ0HafasSearchForw": "1",
        "application": "ECOLOGYINFO",
        "start": "Search connection",
    }

    response = requests.post(url, data=data)

    if response.status_code == 200:
        html = response.text
    else:
        print("Failed to retrieve data. Status code:", response.status_code)
        return

    soup = BeautifulSoup(html, "html.parser")
    data = {
        "ID": f"{dep} to {arr}",
        "train": {
            "co2": None,
            "energy resource consumption": None,
            "products": None,
            "duration": None,
        },
        "car": {
            "co2": None,
            "energy resource consumption": None,
            "products": None,
            "duration": None,
        },
        "flight": {
            "co2": None,
            "energy resource consumption": None,
            "products": None,
            "duration": None,
        },
    }

    if "This information is not available." in soup.text:
        return (dep_coords, arr_coords, data)

    # Get KML url
    base_url = "https://ecopassenger.hafas.de"
    kml_link = soup.find("i", class_="fa fa-globe")
    if kml_link and kml_link.parent:
        kml_url = kml_link.parent.get("href")
        download_kml(base_url + kml_url, f"data/kml_files_new/{dep}_to_{arr}.kml")
    else:
        print("KML link not found.")
    # Parse Products
    products = []

    for div in soup.find_all("div", class_="lc_th", string="Products"):
        product_text = div.find_next_sibling(string=True)
        if product_text:
            products.append(product_text.strip())

    # Save it as a list
    if len(products) > 0:
        data["train"]["products"] = products[0].split(", ")
    if len(products) > 1:
        data["car"]["products"] = products[1].split(", ")
    if len(products) > 2:
        data["flight"]["products"] = products[2].split(", ")

    # Extract CO2 emissions data
    co2_tds = soup.find_all("tr", class_="lc_hide")[0].find_all(
        lambda tag: tag.name == "td"
        and (not tag.has_attr("style") or "bold" in tag.get("class", []))
        and re.search(r"\d", tag.text)
    )
    assign_data(data["train"], "co2", co2_tds, parse_number, 0)
    assign_data(data["car"], "co2", co2_tds, parse_number, 1)
    assign_data(data["flight"], "co2", co2_tds, parse_number, 2)

    # Extract Energy Resource Consumption data
    energy_tds = soup.find_all("tr", class_="lc_hide")[1].find_all(
        lambda tag: tag.name == "td"
        and (not tag.has_attr("style") or "bold" in tag.get("class", []))
        and re.search(r"\d", tag.text)
    )

    assign_data(
        data["train"], "energy resource consumption", energy_tds, parse_number, 0
    )
    assign_data(data["car"], "energy resource consumption", energy_tds, parse_number, 1)
    assign_data(
        data["flight"], "energy resource consumption", energy_tds, parse_number, 2
    )

    tds = soup.findAll("td", class_="sepline borderright top")
    i = 0
    for td in tds:
        if "Duration" in td.text:
            duration_text = td.contents[-1].strip()
            # Ensure there's a valid duration before setting it
            if duration_text:
                duration_seconds = duration_to_seconds(duration_text)
                if i == 0:
                    data["train"]["duration"] = duration_seconds
                elif i == 1:
                    data["car"]["duration"] = duration_seconds
                elif i == 2:
                    data["flight"]["duration"] = duration_seconds
                i += 1

    return (dep_coords or "N/A", arr_coords or "N/A", data)


def main():
    city_pairs = permutations(cities, 2)

    with open("data/city_pairs_co2_duration_new.csv", mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                "ID",
                "Departure City",
                "Arrival City",
                "Departure Coordinates",
                "Arrival Coordinates",
                "Train CO2",
                "Train Energy Resource Consumption",
                "Train Products",
                "Train Duration",
                "Car CO2",
                "Car Energy Resource Consumption",
                "Car Products",
                "Car Duration",
                "Flight CO2",
                "Flight Energy Resource Consumption",
                "Flight Products",
                "Flight Duration",
            ]
        )

        for dep, arr in tqdm(
            city_pairs,
            desc="Processing City Pairs",
            unit="pair",
            total=math.perm(len(cities), 2),
        ):
            # formatted_day = day.strftime("%a, %d.%m.%y")
            try:
                dep_coords, arr_coords, data = calculate_co2_and_duration(dep, arr)
                # Even if some data is missing, proceed to write the available data
                writer.writerow(
                    [
                        data["ID"],
                        dep,
                        arr,
                        dep_coords,
                        arr_coords,
                        data["train"]["co2"] or "N/A",
                        data["train"]["energy resource consumption"] or "N/A",
                        (
                            ", ".join(data["train"]["products"])
                            if data["train"]["products"]
                            else "N/A"
                        ),
                        (
                            seconds_to_duration(data["train"]["duration"])
                            if data["train"]["duration"] is not None
                            else "N/A"
                        ),
                        data["car"]["co2"] or "N/A",
                        data["car"]["energy resource consumption"] or "N/A",
                        (
                            ", ".join(data["car"]["products"])
                            if data["car"]["products"]
                            else "N/A"
                        ),
                        (
                            seconds_to_duration(data["car"]["duration"])
                            if data["car"]["duration"] is not None
                            else "N/A"
                        ),
                        data["flight"]["co2"] or "N/A",
                        data["flight"]["energy resource consumption"] or "N/A",
                        (
                            ", ".join(data["flight"]["products"])
                            if data["flight"]["products"]
                            else "N/A"
                        ),
                        (
                            seconds_to_duration(data["flight"]["duration"])
                            if data["flight"]["duration"] is not None
                            else "N/A"
                        ),
                    ]
                )
            except Exception as e:
                print(f"Failed to process {dep} to {arr}: {e}")
    print("Data has been written to 'city_pairs_co2_duration_new.csv'")


if __name__ == "__main__":
    main()
