# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Stefan Krsteski | 370315 |
| Andrea La Grotteria | 358361 |
| Matea Tashkovska | 370319 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (29th March, 5pm)

**10% of the final grade**

### Dataset

For our project, we've constructed our own dataset by extracting data from the  EcoPassenger [website](https://ecopassenger.hafas.de/bin/query.exe/en?L=vs_uic), which provides calculations for emissions and travel times across different modes of transport between cities. The script used for scraping is available under [`src/scraper.py`](https://github.com/com-480-data-visualization/com-480-project-ecoroutes/blob/master/Milestone%201/src/scraper.py). EcoPassenger is developed by the International Railways Union and the methodology for calculating the emissions is well verified and [documented](https://ecopassenger.hafas.de/bin/help.exe/en?L=vs_uic&tpl=methodology).

We selected a diverse set of 90 cities across Europe, guided by a principle to include at least one city from each country, alongside with others noted for their size and popularity. The city list was derived from the [Lists of cities in Europe](https://en.wikipedia.org/wiki/Lists_of_cities_in_Europe). For each possible city pair, we extracted the travel times and environmental impacts (carbon dioxide emissions and energy consumption)  across different modes of transportation (cars, trains, and planes). Moreover, we detailed the 'products' of each travel connection, which denotes the required changes in flights or trains necessary to complete each journey.

Furthermore, we enriched our dataset with geographical information, more specifically each connection's departure and arrival country, which will be used to do country-level analyses. We further augmented this data by categorizing each connection based on the departure and arrival regions, as defined by [*Figure 2.16 Regions of Europe*](https://open.lib.umn.edu/worldgeography/chapter/2-3-regions-of-western-europe/), in order to explore regional travel patterns and their environmental implications.

Finally, for every city pair, we extracted its train-route KML file, which will serve as a foundation for mapping the routes and will enhance our project by providing a visual representation of the travel networks across Europe.

The final dataset can be found [here](https://github.com/com-480-data-visualization/com-480-project-ecoroutes/tree/master/Milestone%201/data).

### Problematic

Concern over CO2 emissions has grown over the past few decades, and travel is a major contributor to this issue. With environmental sustainability becoming more and more important, it's essential for people to understand the impact of their travel choices. Motivated by the importance of sustainable travel, our main goal is to make it easier for everyone to see how choosing one mode of transport over another can make a big difference in terms of pollution. Making meaningful data visualizations can be extremely helpful in order to better explain and emphasize the benefits of choosing more environmentally friendly transportation options. Targeted at a broad audience ranging from everyday travellers to transport policy-makers, our project's goal is to promote a shift towards more sustainable travel practices. Using geographical details like departure and arrival countries, along with categorizing routes based on European regions, we aim to show specific areas where improvements in railway policies can significantly reduce CO2 emissions. 

We plan to achieve our goal with several possible visualizations, including for example:
- An interactive map that allows the user to easily compare the CO2 emissions of various routes using different means of transport, both from pre-curated lists and a set chosen by the user
- A heatmap of the destinations reachable from a given source within a certain time travel bound with their relative emissions
- Smaller visualizations providing insights into which regions and countries are the most successful in green transportation policies

### Exploratory Data Analysis

After scraping the data, our dataset comprises 5153 routes. Each route consists of the departure and arrival city, country, and region, as well as the train, car, and flight duration, CO2 emissions and energy resource consumption. Additionally, the dataset includes information on the ‘products’ for each type of travel connection, which represent the number of transfers a traveller must make during their journey. In the dataset, several routes didn’t have CO2 information and were removed.

Besides a naive average of the CO2 emissions and energy consumption of the three modes for a certain route, we calculated a weighted average that takes into account an estimation of the market share of the train compared to the market share of the plane. We used the following regression, from [Xia, Wenyi, Anming Zhang](https://doi.org/10.1016/j.trb.2016.10.006):

![Regression for train vs plane market share](https://github.com/com-480-data-visualization/com-480-project-ecoroutes/assets/20169200/4b7748d5-6c23-4115-8d26-7c80ba4920fc)
*Figure 1. Regression for train vs plane market share*

We also computed the "in-flight" distance between each pair of cities, using haversine distance.

The CO2 emission data for trains is right-skewed, meaning most train routes have lower emissions but a few have very high emissions. For cars, the CO2 emissions are normally distributed, while flight CO2 emissions show a bimodal distribution, indicating two distinct groups of flights based on their emissions. The average CO2 emissions for trains, cars, and flights are 55.83, 128.06, and 180.09 Kg respectively.

<p align="center">
  <img src="https://github.com/com-480-data-visualization/com-480-project-ecoroutes/assets/58995762/161ecc15-4e4c-4b37-a12a-e86b0ab18290" alt="Distribution of CO2 Emissions by Transportation Mode">
  <br>
  <em>Figure 2. Distribution of CO2 Emissions by Transportation Mode</em>
</p>

In our regression analysis, we investigated how travel duration affects CO2 emissions across the three transportation modes. We found a positive correlation overall, meaning longer journeys tend to produce more CO2, which is expected. Specifically, the relationship between CO2 emissions from cars and their travel duration is almost a perfectly straight line. This is because the calculations for car CO2 emissions are based on a single vehicle type (a mid-class, Diesel EURO 4 car) according to the EcoRoutes website.

![Relationship Between Travel Duration and CO2 Emissions Across Transportation Modes](https://github.com/com-480-data-visualization/com-480-project-ecoroutes/assets/58995762/ed9b5dc6-4dfa-4109-9705-ec7680623d43)
*Figure 3. Relationship Between Travel Duration and CO2 Emissions Across Transportation Modes*

Lastly, we used KML files to create a map highlighting the train route with the highest CO2 emissions.

![Highlighting the Train Route with the Highest CO2 Emissions](https://github.com/com-480-data-visualization/com-480-project-ecoroutes/assets/58995762/200c8751-0858-4691-810a-56bd70aa4512)
*Figure 4. Highlighting the Train Route with the Highest CO2 Emissions*

In [`EDA.ipynb`](https://github.com/com-480-data-visualization/com-480-project-ecoroutes/blob/master/Milestone%201/notebooks/EDA.ipynb) you will find the code for the data preprocessing and exploratory data analysis, as well as other visualizations we produced.


### Related work

The data currently provided by EcoPassenger gives environmentally conscious users useful information when deciding which mean of transportation to use for a given route, but fails to provide a broader picture of the state of transport modes in different countries and regions in Europe. 
So in our approach, we are inspired by works like [OpenRitardi](https://github.com/giacomoorsi/OpenRitardi), which aims to democratize access to data which is already available but not in an aggregated and easy-to-visualize form.

Another work that represents a source of inspiration is [Chronotrain](https://www.chronotrains.com/en), which provides a map of the destinations reachable by public transport from a given source and within a certain time travel bound, since it follows a goal similar to the previous one and is interesting especially for the visualizations used.

Therefore our original contribution consists of applying this democratizing approach to CO2 emission data from EcoPassenger, something that has not yet been done, to the best of our knowledge.

<!-- > - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class. -->

## Milestone 2 (26th April, 5pm)

**10% of the final grade**


## Milestone 3 (31st May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

