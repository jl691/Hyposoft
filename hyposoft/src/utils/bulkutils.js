function parseCSVFile (file, callback) {
    var formData = new FormData()

    formData.append('file', file)

    fetch('https://hyposoft-53c70.appspot.com/parseCSV', {
        method: 'POST',
        body: formData,
    }).then(response => {
        response.json().then(data => {
            callback(data)
        })
    })
}

export { parseCSVFile }
