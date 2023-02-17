const path = require('path')
const express = require('express')
const hbs = require('hbs')
const dayjs = require('dayjs')
const hlQuery = require('./query')

const app = express()

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))
app.use(express.json());
app.use(express.urlencoded({extended: true}));

hbs.registerHelper('setSelected', function(item, selectedVal){
  if(item == selectedVal)
    return 'selected';
  else
    return ''
})

const getYearList = () => {
  const currentYear = new Date().getFullYear();
  const yearList = [];
  for(let i=-3; i<=3; i++){
      yearList.push(currentYear +i);
  }
  return yearList
}

const getYearFromDate = (date) => {
  return date.substring(0, 4);
}

const getViewData = (req) => {
  return holiday = {
    _id: req.body.hId,
    Date: req.body.hDate,
    Desc: req.body.hDesc,
    Type: req.body.hType,
    Locations: req.body.hLoc
  }
}

const dbConnected = () => hlQuery.checkDBConnection()

app.get('/', async (req, res) => {
  if(!dbConnected()){
    res.render('holidayList', {"failureMsg" : "Database is not connected!"})
    return 
  }
  let failureMsg = '';
  let year = '';
  if(!req.query.year){
    year = new Date().getFullYear()
  }else{
    year = req.query.year;
  }
  const holidays = await hlQuery.getAllHolidaysForYear(year);
  holidays.map((obj, i) => {
    obj.Date = dayjs(obj.Date).format('MM-DD-YYYY')
  })
  if(holidays.length == 0){
    failureMsg = 'No holidays found for selected year:'
  }
  const pageData = {
    title:'Holiday List',
    yearList: getYearList(),
    failureMsg: failureMsg,
    selectedYear: year,
    holidayData: holidays
  }
  res.render('holidayList', pageData)
})
app.get('/holidays/view/:id', async (req, res) => {
  if(!dbConnected()){
    res.render('holidayList', {"failureMsg" : "Database is not connected!"})
    return 
  }
  const holiday = await hlQuery.findHolidayById(req.params.id);
  const pageData = {
    title: "Holidays Detail",
    readOnly: true,
    newRecord: false,
    selectedYear: getYearFromDate(holiday.Date),
    holidayData: holiday
  }
  res.render('holidayDetail', pageData);
})
app.get('/holidays/update/:id', async (req, res) => {
  if(!dbConnected()){
    res.render('holidayList', {"failureMsg" : "Database is not connected!"})
    return 
  }
  const holiday = await hlQuery.findHolidayById(req.params.id);
  const pageData = {
    title: "Holidays Detail",
    newRecord: false,
    readOnly: false,
    selectedYear: getYearFromDate(holiday.Date),
    holidayData: holiday
  }
  res.render('holidayDetail', pageData);
})

app.post('/holidays/view', async (req, res) => {
  const hlSelectedYear = req.body.hlSelectedYear
  if(!dbConnected()){
    res.render('holidayDetail', {
      "failureMsg" : "Database is not connected!",
      "selectedYear" : hlSelectedYear
    })
    return 
  }
  const holiday = await hlQuery.findHolidayById(req.body.hId);
  pageData = {
    title: "Holidays Detail",
    readOnly: true,
    newRecord: false,
    selectedYear: hlSelectedYear,
    holidayData: holiday
  }
  res.render('holidayDetail', pageData);
})
app.post('/holidays/update', async (req, res) => {
  let pageData = {}
  const hlSelectedYear = req.body.hlSelectedYear
  if(!dbConnected()){
    pageData.holidayData = getViewData(req)
    pageData.failureMsg = 'Database is not connected!'
    pageData.selectedYear = hlSelectedYear
    res.render('holidayDetail', pageData)
    return 
  }
  const holiday = await hlQuery.findHolidayById(req.body.hId);
  pageData = {
    title: "Holidays Detail",
    newRecord: false,
    readOnly: false,
    selectedYear: hlSelectedYear,
    holidayData: holiday
  }
  res.render('holidayDetail', pageData);
})
app.post('/holidays/new', (req, res) => {
  if(!dbConnected()){
    res.render('holidayList', {'failureMsg': 'Database is not connected!'})
    return 
  }
  const hlSelectedYear = req.body.year
  const pageData = {
    title: "Holidays Detail",
    readOnly: false,
    newRecord: true,
    selectedYear: hlSelectedYear,
    holidayData: {_id:'', Date:'', Desc:'', Type:'', Locations:''}
  }
 
  res.render('holidayDetail', pageData);
})
app.post("/holidays/create", async(req, res) => {
  const pageData = {}
  const holiday = {
    Date: req.body.hDate,
    Desc: req.body.hDesc,
    Type: req.body.hType,
    Locations: req.body.hLoc
  }
  pageData.title = "Holidays Detail"
  pageData.readOnly = false
  pageData.newRecord = false
  pageData.holidayData = holiday
  pageData.selectedYear = req.body.hlSelectedYear
  if(!dbConnected()){
    holiday._id = req.body.hId
    pageData.failureMsg = 'Database is not connected!'
    res.render('holidayDetail', pageData)
    return 
  }

  if(holiday.Date == '' || holiday.Desc == '' || holiday.Type == '' || holiday.Locations == '') {
    pageData.newRecord = true
    pageData.failureMsg = 'All fields are required!'
    res.render('holidayDetail', pageData)
    return
  }

  const result = await hlQuery.findHoliday(holiday)
 // Insert Flow
  if (req.body.hId == '') {
    if (result) {
      pageData.failureMsg = 'Duplicate Found!'
      pageData.newRecord = true
    }else{
      const result = await hlQuery.createHoliday(holiday);
      if(result.acknowledged){
        holiday._id = result.insertedId
        pageData.successMsg = 'Holiday created successfully!'
      }
    }
  } else { //Update flow
    holiday._id = req.body.hId
    if(result && (holiday._id != result._id)){
      pageData.failureMsg = 'Duplicate Found!'
    }else{
      const result = await hlQuery.updateHolidayById(holiday)
      if(result.modifiedCount == 1){
        pageData.successMsg = 'Holiday record update successful'
        pageData.selectedYear = req.body.hlSelectedYear
      }else{
        pageData.successMsg = 'Holiday record update successful'
      }
    }
  }
  res.render('holidayDetail', pageData)
})
app.post('/holidays/delete', async(req, res) => {
  if(!dbConnected()){
    res.render('holidayDetail', {'failureMsg' : 'Database is not connected'})
    return 
  }
  const result = await hlQuery.deleteHolidayById(req.body.hId)
  if(result.acknowledged){
    res.redirect('/?year=' + getYearFromDate(req.body.hDate));
  }
})

app.listen(3000, () => {console.log('app is running on port 3000')})
    .on('error', function(err) { 
      console.log('address already in use -> 3000'); 
      process.exit(1);
    });






