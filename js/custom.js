var Idb = null

function create_openDB() {
    var version = 10;
    var request = indexedDB.open("haryo");

    // We can only create Object stores in a versionchange transaction.
    request.onupgradeneeded = function(e) {
        var db = e.target.result;
        db.createObjectStore("todo", {
            keyPath: "id",
            autoIncrement: true
        });
        Idb = db
        PrintDBInformation(db)
    };

    request.onsuccess = function(e) {
        Idb = e.target.result;
    };
}

function addRow(title, desc, cat) {
    var txn = Idb.transaction(['todo'], 'readwrite');
    var store = txn.objectStore('todo')
    var data = {
        title: title,
        desc: desc,
        cat: cat,
        timestamp: new Date()
    }
    if (cat != undefined && cat != null)
        data.category = cat
    var re = store.put(data);
    re.onsuccess = function() {
        $('#AddNoteModal').modal('hide');
        getRecords()
    }
    re.onerror = function() {
        alert('failed to add note.')
    }
}

function getRecords() {
    var txn = Idb.transaction(['todo'], 'readwrite');
    var store = txn.objectStore('todo')
    var cur = store.openCursor()
    $('.notes-container').empty()
    cur.onsuccess = function(e) {
        var res = e.target.result;
        if (res) {
            displayNote(res.value, res.key)
            res.continue()
        }
    }
    if ($('.notes-container note').length == 0) {
        $('.notes-container').html('<span class="empty-msg">Start by clicking add note on top right!!!</span>')
    }

}

function displayNote(row, key) {
    var n = $('<div/>').addClass('note');
    var rm = $('<a/>').addClass('removeNote').html('&times;').attr({
        onclick: 'deleteNote("' + key + '");'
    })
    var up = $('<a/>').addClass('updateNote').html('edit').attr({
        onclick: 'showUpdateNote("' + key + '");'
    })
    var l = $('<div/>').addClass('pull-left noteLeft')
    var r = $('<div/>').addClass('pull-right noteRight').append(up).append(rm)
    var t = $('<div/>').addClass('note-title').text(row.title);
    var d = $('<div/>').addClass('note-desc').text(row.desc);
    if (row.category != undefined && row.category != null) {
        switch (row.category) {
            case "any":
                l.html('<span class="catSatus">any</span>');
                break;
            case "imp":
                l.html('<span class="catSatus text-danger">Imp</span>');
                break;
            case "personal":
                l.html('<span class="catSatus ">Personal</span>');

                break;
            case "office":
                l.html('<span class="catSatus">Office</span>');
                break;
        }
        $('.notes-container').append(n.append(l).append(r).append(t).append(d))
    } else
        $('.notes-container').append(n.append(r).append(t).append(d))

}

function PrintDBInformation(idb) {
    if (idb) {
        var sName = idb.name;
        var dVersion = idb.version;
        var dTableNames = idb.objectStoreNames;
        var strNames = "IndexedDB name: " + sName + "; version: " + dVersion + "; object stores: ";
        for (var i = 0; i < dTableNames.length; i++) {
            strNames = strNames + dTableNames[i] + ", ";
        }
        console.log(strNames);
    }
}

$(document).ready(function() {
    //var req = indexedDB.deleteDatabase('haryo');
    create_openDB();
    setTimeout(function() {

        getRecords()
    }, 1000)
});

function showAddNoteModal() {
    $('#AddNoteModal').find('.modal-footer button').attr({
        onclick: 'submitAddNote();'
    }).text('Add');
    $('#noteTitle').val('')
    $('#noteDescription').val('')
    $('#AddNoteModal').modal('show')
}

function submitAddNote() {
    //var img = $('#noteImage').val();
    //formImageBlob(img)
    if ($('#noteTitle').val() != undefined && $('#noteTitle').val() != null && $('#noteTitle').val().length > 0) {
        var title = $('#noteTitle').val()
    } else
        return false
    if ($('#noteDescription').val() != undefined && $('#noteDescription').val() != null && $('#noteDescription').val().length > 0) {
        var desc = $('#noteDescription').val()
    } else
        return false
    var cat = $('#noteCategory').val()
    addRow(title, desc, cat);
}

function deleteNote(id) {
    var txn = Idb.transaction(['todo'], 'readwrite');
    var store = txn.objectStore('todo');
    var req = store.delete(parseInt(id))
    req.onsuccess = function(e) {
        console.log(id + ' deleted.');
        getRecords();
    }
}

function showUpdateNote(id) {
    $('#AddNoteModal').find('.modal-footer button').attr({
        onclick: 'updateNote("' + id + '");'
    }).text('Update');
    var txn = Idb.transaction(['todo'], 'readwrite');
    var store = txn.objectStore('todo');
    var req = store.get(parseInt(id))
    req.onsuccess = function(e) {
        var res = e.target.result;
        if (res) {
            $('#noteTitle').val(res.title)
            $('#noteDescription').val(res.desc);
            $('#AddNoteModal').modal('show');
        }
    }


}

function updateNote(id) {
    if ($('#noteTitle').val() != undefined && $('#noteTitle').val() != null && $('#noteTitle').val().length > 0) {
        var title = $('#noteTitle').val()
    } else
        return false
    if ($('#noteDescription').val() != undefined && $('#noteDescription').val() != null && $('#noteDescription').val().length > 0) {
        var desc = $('#noteDescription').val()
    } else
        return false
    var cat = $('#noteCategory').val()
    var txn = Idb.transaction(['todo'], 'readwrite');
    var store = txn.objectStore('todo');
    var req = store.openCursor(IDBKeyRange.only(parseInt(id)));
    req.onsuccess = function(e) {
        var cursor = e.target.result
        cursor.value.desc = desc
        cursor.value.title = title
        cursor.value.timestamp = new Date();
        if (cat != undefined && cat != null)
            cursor.value.category = cat;
        var oReq = cursor.update(cursor.value);
        oReq.onsuccess = function(e) {
            $('#AddNoteModal').modal('hide');
            getRecords();
        }
        oReq.onerror = function() {
            alert('failed to add note.')
        }
    }
}

function formImageBlob(img) {
    // Create XHR
    img = 'http://sailtrainingireland.com/wp-content/uploads/2014/02/News.jpg'
    var xhr = new XMLHttpRequest(),
        blob;

    xhr.open("GET", img, true);
    // Set the responseType to blob
    xhr.responseType = "blob";

    xhr.addEventListener("load", function() {
        if (xhr.status === 200) {
            console.log("Image retrieved");

            // File as response
            blob = xhr.response;
            console.log(blob)
            // Put the received blob into IndexedDB
            //putElephantInDb(blob);
        }
    }, false);
    // Send XHR
    xhr.send();
}

function search(obj) {
    var text = $(obj).val();
    if (text != undefined && text.length > 0) {
        text = text.toLowerCase();
        $('.notes-container .note').each(function() {
            $(this).addClass('hide');
            var tit = $(this).find('.note-title').text().toLowerCase()
            var des = $(this).find('.note-desc').text().toLowerCase();
            if (tit.indexOf(text) > -1) {
                $(this).removeClass('hide');
            } else if (des.indexOf(text) > -1) {
                $(this).removeClass('hide');
            }
        })
    } else {
        $('.notes-container .note').removeClass('hide')
    }
}