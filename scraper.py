import requests
from bs4 import BeautifulSoup
import csv
from itertools import combinations

cities = [
    "Tirana",
    "Vienna",
    "Torino",
    "Porto",
    "Brussels",
    "Sofia",
    "Brno",
    "Zagreb",
    "Prague",
    "Copenhagen",
    "Toulouse",
    "Tallinn",
    "Munich",
    "Helsinki",
    "Paris",
    "Lyon",
    "Berlin",
    "Athens",
    "Stockholm",
    "Budapest",
    "Bucharest",
    "Rome",
    "Madrid",
    "Istanbul",
    "Moscow",
    "London",
    "Graz",
    "Hamburg",
    "Barcelona",
    "Milan",
    "Belgrade",
    "Ljubljana",
    "Zurich",
    "Bern",
    "Lisbon",
    "Napoli",
    "Amsterdam",
    "Warszawa",
    "Riga",
    "Oslo"
]

# cities = ["Daillon","Torino"]


def string_to_number(s):
    # Split the string into the integer part and the decimal part
    integer_part = s[:-6]
    decimal_part = s[-6:]
    
    # Combine the parts into a final number
    result = float(f"{integer_part}.{decimal_part}")
    
    return result

def get_station_info(city_name):
    url = f"https://ecopassenger.hafas.de/bin/ajax-getstop.exe/eny?start=1&getattr=1&tpl=suggest2json&REQ0JourneyStopsS0A=255&getstop=1&noSession=yes&REQ0JourneyStopsB=&REQ0JourneyStopsS0G={city_name}?&js=true&"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.text
            start = data.find('{')
            end = data.rfind('}')
            json_str = data[start:end+1]
            
            suggestions = eval(json_str)['suggestions'][0]  # Using eval here due to the response format
            
            # Extract 'id' and 'value' from the first suggestion
            station_id = suggestions['id']
            station_value = suggestions['value']
            station_coordinates = {string_to_number(suggestions['xcoord']), string_to_number(suggestions['ycoord'])}
            
            return station_id, station_value, station_coordinates
        else:
            return None, None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None, None

def parse_number(s):
    return float(s.replace(',', '.'))

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

def calculate_co2_and_duration(dep,arr):
    dep_id, dep_value, dep_coords = get_station_info(dep)
    arr_id, arr_value, arr_coords = get_station_info(arr)

    # URL to send the POST request to
    url = "https://ecopassenger.hafas.de/bin/query.exe/en?ld=uic-eco&L=vs_uic&protocol=https:&OK"

    # Form data to be sent with POST request
    data = {
        'queryPageDisplayed': 'yes',
        'REQComparisonCarload': '0',
        'REQ0Total_KissRide_maxDist': '5555500',
        'REQ0JourneyStopsS0A': '1',
        'REQ0JourneyStopsS0G': dep_value,
        'REQ0JourneyStopsS0ID': dep_id,
        'REQ0JourneyStopsZ0A': '1',
        'REQ0JourneyStopsZ0G': arr_value,
        'REQ0JourneyStopsZ0ID': arr_id,
        'REQ0JourneyDate': 'We, 27.03.24',
        'wDayExt0': 'Mo|Tu|We|Th|Fr|Sa|Su',
        'REQ0JourneyTime': '06:00',
        'REQ0HafasSearchForw': '1',
        'application': 'ECOLOGYINFO',
        'start': 'Search connection'
    }

    response = requests.post(url, data=data)

    if response.status_code == 200:
        html = response.text
    else:
        print("Failed to retrieve data. Status code:", response.status_code)
        return

    soup = BeautifulSoup(html, 'html.parser')
    data = {
        'train': {'co2': None, 'duration': None},
        'car': {'co2': None, 'duration': None},
        'flight': {'co2': None, 'duration': None},
    }
    
    if 'This information is not available.' in soup.text:
        return (dep_coords, arr_coords, data)
    
    # Extract CO2 emissions data
    rows = soup.findAll('tr', class_='lc_hide')
    for row in rows:
        if 'Carbon dioxide' in row.text:
            # Each 'td' tag in this row contains the data we need
            co2_data = row.findAll('td', class_='sepline nowrap right')
            i = 0
            # Order is train, car, total flight
            if co2_data[0].get('style', '')=="color:#888;":
                tot = row.findAll('td', class_='sepline nowrap right bold')
                data['train']['co2'] = parse_number(tot[0].text.strip())
                i+=2
            else:
                data['train']['co2'] = parse_number(co2_data[i].text.strip())
                i+=1
            data['car']['co2'] = parse_number(co2_data[i].text.strip())
            i+=1
            # if co2_data[-1].text.strip()

            # print(co2_data)
            if(i==len(co2_data)):
                data['flight']['co2'] = -1
                data['flight']['duration'] = -1
            else:
                data['flight']['co2'] = parse_number(co2_data[i].text.strip())+parse_number(co2_data[i+1].text.strip())


    tds = soup.findAll('td', class_='sepline borderright top')
    i=0
    for td in tds:
        if 'Duration' in td.text:
            duration = td.contents[-1].strip()
            if i == 0:
                data['train']['duration'] = duration_to_seconds(duration)
            if i == 1:
                data['car']['duration'] = duration_to_seconds(duration)
            if i == 2:
                data['flight']['duration'] = duration_to_seconds(duration)
            i+=1


    return (dep_coords, arr_coords, data)

city_pairs = combinations(cities, 2)


with open('city_pairs_co2_duration.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['Departure City', 'Arrival City', 'Departure Coordinates', 'Arrival Coordinates', 'Train CO2', 'Train Duration', 'Car CO2', 'Car Duration', 'Flight CO2', 'Flight Duration'])

    for dep, arr in city_pairs:
        dep_coords, arr_coords, data = calculate_co2_and_duration(dep, arr)
        if data['train']['co2'] is None:
            continue
        writer.writerow([
            dep, arr, dep_coords, arr_coords,
            data['train']['co2'], data['train']['duration'],
            data['car']['co2'], data['car']['duration'],
            data['flight']['co2'], data['flight']['duration']
        ])

print("Data has been written to 'city_pairs_co2_duration.csv'")