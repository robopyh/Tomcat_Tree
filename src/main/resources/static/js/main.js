const createAndAppendNewItem = function (parent, id, text, type) {

    // create element with common properties
    const newItem = jQuery('<li/>', {
        id: 'item_' + id,
        class: type,
        html: '<span draggable=true>' + text + '</span>',
        'aria-expanded': false
    });

    // set properties for folder
    if (type === 'folder') {
        newItem.attr('aria-expanded', 'false');
        //blank list for future children
        newItem.append(jQuery('<ul/>', {id:'item_' + id + '_group'}));
        // append folders before files
        if (parent.children().has('.file').length === 0)
            parent.find('ul:first').append(newItem);
        else
            parent.find('ul:first').children('.file:first').before(newItem);
    }
    else {
        // append file
        parent.find('ul:first').append(newItem);
    }

    return newItem;
};

const loadItems = function (documents, parent) {
    // for each item in the set
    for (let document of documents) {
        // create new item and append it to parent list
        createAndAppendNewItem(parent, document.id, document.text, document.folder === true ? 'folder' : 'file')
    }
    parent.addClass('loaded');
    parent.removeClass('loading');
};

// get DB id from the string
const getLongId = function (element) {
    return element.attr('id').split('_')[1];
};

// create new folder or file
const newItem = function (item, type) {
    // create new item on server and get it ID
    fetch('/tree/createItem', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'post',
        body: JSON.stringify({
            'parent': getLongId(item),
            'text': 'New ' + type,
            'folder': type === 'folder' ? 'true' : 'false'
        })
    })
        .then(function (response) {return response.text()})
        .then(function (id) {
        // if folder is not loaded, save new item with default name
        if (!item.hasClass('loaded')) {
            Swal('Done!', 'New ' + type + ' was successfully saved.', 'success');
            return;
        }
        // create new element and let user edit it name
        if (item.attr('aria-expanded') === 'false')
            item.attr('aria-expanded', 'true');
        const newItem = createAndAppendNewItem(item, id, 'New ' + type, type);
        editItem(newItem.find('span'));
    });
};

// edit folder- or filename
const editItem = function (item) {
    const oldText = item.html();

    // allow edit text
    item.attr('contentEditable','true');
    // prevent item from other actions
    item.addClass('editable');
    item.attr('draggable', 'false');
    // attracts user attention
    item.focus();
    document.execCommand('selectAll', false, null);

    // when an item loses focus
    //
    // multiple events was noticed, so one() method is used
    $('.editable').one('blur', function () {
        // return element to usual state
        $(this).removeClass('editable');
        $(this).removeAttr('contentEditable');
        $(this).attr('draggable', 'true');

        // if a text wasn't changed
        if (oldText === $(this).html())
            return;

        fetch('/tree/item/changeText', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'post',
            body: JSON.stringify({
                'itemId': getLongId($(this).parent()),
                'newText': $(this).html()
            })
        });
        // allow apply on the 'Enter'
    }).on('keydown', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            $(this).blur();
        }
    });
};

// delete an item
const deleteItem = function (item) {
    fetch('tree/item/delete/', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'post',
        body: getLongId(item)
    }).then(function (response) {
        if(response.ok)
            item.remove();
        });
};

// MOVE implementation
// dnd handlers
let dragElement = null;
let dragElementParent = null;
$(function () {
    $('.tree')
        // Start
        // decrease opacity and get item outerHTML
        .on('dragstart', 'span:not(.editable)', function (e) {
            e = e.originalEvent;
            dragElement = $(this);
            // get a parent list item span
            // need to prevent drop on that span
            dragElementParent = dragElement.closest('ul').parent().find('span:first');

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', dragElement.parent()[0].outerHTML);

            dragElement.css('opacity', 0.4);
        })
        // End
        // restore opacity and hide target border
        .on('dragend', 'span', function () {
            $('span.over').removeClass('over');
            dragElement.css('opacity', 1);
            dragElement = null;
            dragElementParent = null;
        })
        // Enter (folders only)
        // allows to drop
        .on('dragover', '.folder > span, .root > span', function (e) {
            // if a drag element is not a tree item span (e.g. text)
            // also prevent element from dropping on itself or on it parent
            if(dragElement === null || $(this).is(dragElement) || $(this).is(dragElementParent))
                return;

            e = e.originalEvent;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        })
        // Over (folders only)
        // display target border
        .on('dragenter', '.folder > span, .root > span', function () {
            if(dragElement === null || $(this).is(dragElement) || $(this).is(dragElementParent))
                return;

            $(this).addClass('over');
        })
        // Leave (folders only)
        // hide target border
        .on('dragleave', '.folder > span, .root > span', function () {
            if(dragElement === null || $(this).is(dragElement) || $(this).is(dragElementParent))
                return;

            $(this).removeClass('over');
        })
        // Drop  (folders only)
        //post request to change parent ID
        //remove the draggable element and create the same one as a target child
        .on('drop', '.folder > span, .root > span', function (e) {
            if(dragElement === null || $(this).is(dragElement) || $(this).is(dragElementParent))
                return;

            e = e.originalEvent;

            // check that a target is not a child element
            const request = new XMLHttpRequest();
            request.open('GET', '/tree/item/' + getLongId(dragElement.parent()) + '/has/' + getLongId($(this).parent()), false);
            request.send(null);

            if (request.responseText === 'true') {
                Swal('Moving error!', 'Target folder is a child of the move folder.', 'error');
            }
            else {
                fetch('/tree/item/changeParent', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: 'post',
                    body: JSON.stringify({
                        'itemId': getLongId(dragElement.parent()),
                        'newParentId': getLongId($(this).parent())
                    })
                });
                // copy 'dragend'
                // we need to remove drag element so 'dragend' event wouldn't be fired
                $('span.over').removeClass('over');
                dragElementParent = null;

                dragElement.parent().remove();
                // if a list is not expanded yet, new element will be loaded from the DB with others
                // if a list is loaded, just create a new element
                if ($(this).parent().hasClass('loaded')) {
                    $(this).parent().find('ul:first').append(e.dataTransfer.getData('text/html'));
                }
            }
        });
});

// click handlers
$(function () {

    // change focus and expand/shrink folders on click
    $('.tree').on('click', 'span:not(.editable)', function (e) {
        // change focus
        $('span.focus').removeClass('focus');
        $(this).addClass('focus');

        // get clicked list element
        const obj = $(this).parent();

        if (obj.is('.folder')) {
            // load data on expand folder
            // if this folder hadn't loaded yet and doesn't loading now
            // mark it as 'loading' (new style will be applied), fetch data from DB and create new elements
            if (obj.hasClass('loaded') === false && obj.hasClass('loading') === false) {
                obj.addClass('loading');
                fetch('/tree/item/' + getLongId(obj) + '/children')
                    .then(function (response) { return response.json() })
                    .then(function (documents) { loadItems(documents, obj) });
            }

            // expand folder
            // inverse 'aria-expanded' value
            if (obj.attr('aria-expanded') === 'true') {
                obj.attr('aria-expanded', 'false');
            } else {
                obj.attr('aria-expanded', 'true');
            }
        }
        // prevent "outside" click
        e.stopPropagation();
    });

    //remove focus class on click outside
    $(document).on('click', function () {
            $('span.focus').removeClass('focus');
    });
});

// MENU
// set different context menu for different elements
$(function() {
    $.contextMenu({
        selector: '.folder > span',
        items: {
            'new': {
                name: 'New',
                icon: 'fa-clone',
                items: {
                    'file': {name: 'File', icon: 'fa-file-o', callback: function(key, opt) {
                        newItem(opt.$trigger.parent(), 'file')
                    }},
                    'folder': {name: 'Folder', icon: 'fa-folder-o', callback: function(key, opt) {
                        newItem(opt.$trigger.parent(), 'folder')
                    }}
                }
            },
            'edit': {name: 'Edit', icon: 'edit', callback: function(key, opt) {editItem(opt.$trigger)}},
            'delete': {name: 'Delete', icon: 'delete', callback: function(key, opt) {deleteItem(opt.$trigger.parent())}}
        }
    });

    $.contextMenu({
        selector: '.file > span',
        items: {
            'edit': {name: 'Edit', icon: 'edit', callback: function(key, opt) {editItem(opt.$trigger)}},
            'delete': {name: 'Delete', icon: 'delete', callback: function(key, opt) {deleteItem(opt.$trigger.parent())}}
        }
    });

    $.contextMenu({
        selector: '.root > span',
        items: {
            'new': {
                name: 'New',
                icon: 'fa-clone',
                items: {
                    'file': {name: 'File', icon: 'fa-file-o', callback: function(key, opt) {
                            newItem(opt.$trigger.parent(), 'file')
                        }},
                    'folder': {name: 'Folder', icon: 'fa-folder-o', callback: function(key, opt) {
                            newItem(opt.$trigger.parent(), 'folder')
                        }}
                }
            }
        }
    });
});

// load root folders
fetch('/tree/roots')
    .then(function (response) { return response.json() })
    .then(function (documents) { loadItems(documents, $('.root')) });