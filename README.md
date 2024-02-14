
# Copernicus Code Crafters

### Team:
Severin Krohne      @skrohne
Kjell Wundram       @kwundram2602
Finn Geßner         @sivenDalmatin
Jan Becker          @job2002
Emil Erlenkötter    @emil282
Joaquin Valdez      @jova10


## How to use CCC-eocubes

1. git clone git@github.com:CopernicusCodeCrafters/main.git

2. set environment variable "AWSHOST" of  the "ccceocubes_con"  service to your AWS-IPv4-adress in docker-compose.yml (AWSHOST = AWS-IPv4-adress / AWSHOST=34.209.215.214).
if you are running the application on your local machine, set AWSHOST=ccceocubes_con  .
On the other hand an AWS-IPv4 adress is necessary if you deploy it on an AWS instance and it is highly recommended.
3. docker-compose up --build


## Demo and Tutorial
There is a built machine learning ( random forest) model called "CCC_DemoModell".
With a small area the classification takes around 3 min.



### Exploration with "Viewer"

 Before you classify a scene, you can take a look with the viewer if there are images with a cloudcover that is low enough
1. Enter start and ending time
2. Draw the area of interest
3. Select bands you would like to see
4. "Aggregate all" will reduce the time series to the mean of the band values. By default only images with a cloudcover lower than 10 % will be used. But you can change the cloud cover value.
5. you can also select a specific image with "select one" or get the image with the lowest Cloudcover with "lowest CC".
If you are using "select one" chosse one of the images in the list and close with "x" in the top right corner
It is recommended  to use "aggregate all" beacause the classification and model building processes also use aggregated images.
6. At the end you have to use "Submit"

### Model Creation

1. You can create a machine learning model by uploading or drawing training polygons. After Drawing you can set names, ids and classification.

2. It is important that Features get object Ids that are ascending and they should not have gaps. If you have 17 Features the ids should be : [1...17]

3. After you have created the training polygons you can choose the hyperparamters ntree and mtry.

4. You als can give a name to the model. The model will be saved as a .rds file in  docker folder /var/openeo/workspace

5. After a while a message will be displayed ("DONE"). If not, an error has occured. In that case try it with less polygons.

If you are trying to change attributes of a poylgon and it does not work, change the shape of the polygon a little bit and click "submit edit". Afterwards you can edit the values.

#### Upload of training polygons

It its important that training polygons which are uploaded have a column/attribute "classification" and a column/attribute "object_id".
Otherwise the application wont process the polygons correctly.
In the folder "DemoDaten" you will find training polygons.

### Classification

1. Select area of interest (in the Imagery page).
2. Enter Start and end date (also in imagery page)
3. Select Model , either demo model or your own.
4. Classify

If you get a result immediately and the tif file has a size of 33 kB , that means that the file is damaged and the classification did not work. Please reload the page and try again.
