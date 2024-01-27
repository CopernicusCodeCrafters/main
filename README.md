
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
2. set environment variable "AWSHOST" to your AWS-IPv4-adress in docker-compose.yml
    if you are running the application on your local machine, leave "AWSHOST" empty .
    On the other hand an AWS-IPv4 adress is necessary if you deploy it on an AWS instance.
3. docker-compose up --build

4. Enter your AWS adress or "localhost" in the browser to connect to the backend.


## Demo and Tutorial

### Model Creation
You can create a machine learning model by uploading or drawing training polygons.

After you have created the training polygons you can choose the hyperparamters ntree and mtry.
You als can give a name to the model. The model will be saved as a .rds file.

### Classification




