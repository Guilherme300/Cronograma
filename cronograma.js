const daysContainerElm = document.querySelectorAll('.day-container')
const deleteActivityElm = document.querySelector('#deleteActivity')

let activities = {}
const days = ['seg', 'ter', 'quar', 'quin', 'sex', 'sab', 'dom']

function createActivity(activity){
    activities[activity.day].push(activity)
    saveActivities()
    renderActivities()
}

function deleteActivity(day, index){
    activities[day].splice(index, 1)
    saveActivities()
    renderActivities()
}

function moveActivity(day, newDay, index){
    let activity = activities[day][index]
    activities[newDay].push({...activity})
    activities[day].splice(index, 1)
}

function saveActivities(){
    let toSave = JSON.stringify(activities)
    localStorage.setItem("stored_activities", toSave)
    console.log(`Saving ${Math.floor(toSave.length * 2 / 1024)} kbs`)
}

function loadSavedActivities(){
    let savedActivities = localStorage.getItem('stored_activities')
    if (!savedActivities)
        return 

    activities = JSON.parse(savedActivities)
    renderActivities()
}

function highlight(elm){
    elm.classList.add('highlight')
}

function unhighlight(elm){
    elm.classList.remove('highlight')
}

daysContainerElm.forEach((elm, index) => {
    elm.id = days[index]

    ;['dragenter', 'dragover'].forEach((ev) => {
        elm.addEventListener(ev, (ev)=>{
            ev.preventDefault()
            highlight(elm) 
        })
    })

    ;['dragleave', 'drop'].forEach((ev) => {
        elm.addEventListener(ev, (ev)=>{ 
            ev.preventDefault()
            unhighlight(elm) 
        })
    })

    elm.addEventListener('drop', (ev) => {
        let data = ev.dataTransfer.getData('dataDrop') 
        data = JSON.parse(data)
        moveActivity(data.day, elm.id, data.index)
        saveActivities()
        renderActivities()
    })
})

;['dragenter', 'dragover'].forEach((ev) => {
    deleteActivityElm.addEventListener(ev, (e) => {
        e.preventDefault()
    })
})

deleteActivityElm.addEventListener('drop', (ev) => {
    let data = ev.dataTransfer.getData('dataDrop') 
    data = JSON.parse(data)
    deleteActivity(data.day, data.index)
})

const activitiesKeys = Object.keys(activities)
function renderActivities(){
    daysContainerElm.forEach((i) => { while(i.firstChild) i.removeChild(i.firstChild) })

    days.forEach((day, dayIndex) => {
        activities[day].forEach( (activity, index) => {
            let activityElm = document.createElement('div')
            activityElm.draggable = true
            activityElm.ondragstart = (ev) => { 
                ev.dataTransfer.setData('dataDrop', JSON.stringify({ day, index })) 
                deleteActivityElm.style.opacity = 1
            }
            activityElm.ondragend = () => { deleteActivityElm.style.opacity = 0 }

            activityElm.classList.add('activity')
            
            let activityTitle = document.createElement('p')
            activityTitle.id = 'title'
            activityTitle.innerHTML = activity.title
            activityTitle.title = activity.title
            
            activityElm.append(activityTitle)
            
            let activityTime = document.createElement('p')
            activityTime.id = 'time'
            activityTime.innerHTML = activity.time 
            
            activityElm.append(activityTime)
            
            daysContainerElm[dayIndex].append(activityElm)
    
        })
    })
    
}

loadSavedActivities()

// another script file

let selectDay = document.querySelector('#selectDay')
let configWindow = document.querySelector('.configWindow')
let blackScreen = document.querySelector('.blackScreen')
let createActivityElm = document.querySelector('.createActivity')
let openCreateNewBtn = document.querySelector('.openCreateNewBtn')
let activityButton = document.querySelector('.activityBtn')

createActivityElm.onclick = (ev) => {
    ev.stopPropagation()
}

function hideConfigWindow() {
    blackScreen.style.display = 'none'
    configWindow.style.display = 'none'
}

function showConfigWindow(){
    blackScreen.style.display = 'block'
    configWindow.style.display = 'flex'
}

configWindow.addEventListener('click', hideConfigWindow)
openCreateNewBtn.onclick = showConfigWindow

activityButton.onclick = () => {
    let activityName = (document.querySelector('#activityName')).value
    let daySelector = (document.querySelector('#selectDay')).value
    let activityTime = (document.querySelector('#activityTime')).value

    if (activityName.length < 1)
        return 
    
    createActivity({ title: activityName, day: daySelector, time: activityTime })

    hideConfigWindow()
}

// Creating options for select days
days.forEach((day) => {
    let option = document.createElement('option')
    option.value = day
    option.innerHTML = day 
    selectDay.append(option)
})

const exportBtn = document.querySelector('#config-export')
exportBtn.onclick = () => {
    let activities = localStorage.getItem("stored_activities")
    let file = new Blob([activities], { type: 'text' })

    let a = document.createElement('a')
    a.href = URL.createObjectURL(file)

    let fileName = window.prompt('Nome do arquivo')
    if(!fileName) fileName = "activity_save"

    a.download = fileName + '.txt'

    a.click()
}

const importBtn = document.querySelector('#config-import')
importBtn.onclick = () => {
    let input = document.createElement("input")
    input.type = 'file'

    input.onchange = (ev) => {
        let file = ev.target.files[0]

        if (file.type != "text/plain"){
            console.log("Wrong file type")
            return
        }

        let reader = new FileReader()
        reader.onload = () => {
            let text = reader.result 
            text = JSON.parse(text)

            let allOk = true;
            let data;

            days.forEach((day) => {
                data = text[day];
                if (!data){
                    console.log(`Error getting ${day}`)
                    allOk = false;
                }
            })

            if(allOk){
                activities = text
                saveActivities()    
                renderActivities()
            }

        }
        reader.readAsText(file)
    }

    input.click()
}

let deleteAllBtn = document.querySelector('#config-deleteAll')
deleteAllBtn.onclick = () => {
    let activitiesBuffer = {};
    days.forEach((day) => {
        activitiesBuffer[day] = []
    })

    activities = activitiesBuffer

    saveActivities()
    renderActivities()
}

let configSaveBtn = document.querySelector('#config-save')
configSaveBtn.onclick = () => {
    const csvDelimiter = ','
    let fileBuffer = `day${csvDelimiter} title${csvDelimiter} time`

    days.forEach((day) => {
        activities[day].forEach((activity) => {
            fileBuffer += `\n${day}${csvDelimiter} ${activity.title}${csvDelimiter} ${activity.time}`
        })
    })
    let file = new Blob([fileBuffer])
    let a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = "activities.csv"
    a.click()
}