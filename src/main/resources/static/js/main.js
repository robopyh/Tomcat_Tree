// load items
function loadItems(documents, parent) {
    // for each item in the set
    for (var i = 0; i < documents.length; i++) {
        // create folders
        if (documents[i].folder){
            // blank list for future children
            jQuery('<ul/>', {
                id:'folder_' + documents[i].id + '_group'
            }).appendTo(
                // folder itself
                jQuery('<li/>', {
                    id: 'folder_' + documents[i].id,
                    class: 'folder',
                    html: '<span draggable=true> ' + documents[i].text + '</span>',
                    'aria-expanded': false
                }).appendTo($(parent).find('ul').first())
            );
        }
        // create files
        else {
            jQuery('<li/>', {
                id: 'file_' + documents[i].id,
                class: 'doc',
                html: '<span draggable=true> ' + documents[i].text + '</span>',
            }).appendTo($(parent).find('ul').first());
        }
    }
    $(parent).addClass('loaded');
    $(parent).removeClass('loading');
}

// load root folders
fetch('/tree/roots')
    .then(function (response) { return response.json() })
    .then(function (documents) { loadItems(documents, '.root') });

// expand folder
$(function () {
    $('.tree').on('click', 'span', function (e) {

        // get clicked list element
        var obj = $(this).parent();

        // if it's a folder
        // if this folder hadn't loaded yet and doesn't loading now
        // mark it as 'loading' (new style will be applied), fetch data from DB and create new elements
        if (obj.is('.folder')) {
            if (obj.hasClass('loaded') === false && obj.hasClass('loading') === false) {
                obj.addClass('loading');
                    fetch('/tree/item/' + obj[0].id.split('folder_')[1] + '/children')
                        .then(function (response) { return response.json() })
                        .then(function (documents) { loadItems(documents, obj) });
           }
       }
    });
});

//dnd handlers
var dragElement = null;
$(function () {
    $('.tree')
        // Start
        //decrease opacity and get item outerHTML
        .on('dragstart', 'span', function (e) {
            e = e.originalEvent;
            dragElement = this;

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', dragElement.parentNode.outerHTML);

            this.style.opacity = '0.4';
        })
        // End
        //restore opacity and hide target border
        .on('dragend', 'span', function (e) {
            $('span.over').removeClass('over');
            this.style.opacity = 1;
        })
        // Enter
        //allows to drop
        .on('dragover', 'span', function (e) {
            e = e.originalEvent;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        })
        // Over
        //display target border
        .on('dragenter', 'span', function (e) {
            $(this).addClass('over');
        })
        // Leave
        //hide target border
        .on('dragleave', 'span', function (e) {
            $(this).removeClass('over');
        })
        // Drop
        //post request to change parent ID
        //remove the draggable element and create the same one as a target child
        .on('drop', 'span, i', function (e) {
            e = e.originalEvent;

            // prevent element from dropping on self
            if (dragElement !== this) {
                $.ajax({
                    url: '/tree/changeParent',
                    type: 'POST',
                    data: JSON.stringify({
                        'itemId': dragElement.parentNode.id.split('folder_')[1],
                        'newParentId': this.parentNode.id.split('folder_')[1]
                    }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                });
                dragElement.parentNode.remove();
                $(this).parent().find('ul').first().append(e.dataTransfer.getData('text/html'));
            }
        });
});

//set events handlers
$(function () {

    // change focus and expand/shrink folders on click
    $('.tree').on('click', 'span', function (e) {

        // change focus
        $('span.focus').removeClass('focus');
        $(this).addClass('focus');

        // expand folder
        // inverse 'aria-expanded' value on click
        if ($(this).parent().is('.folder')) {
            if ($(this).parent().attr('aria-expanded') === 'true') {
                $(this).parent().attr('aria-expanded', 'false');
            } else {
                $(this).parent().attr('aria-expanded', 'true');
            }
        }

        e.stopPropagation();
    });

    //remove focus class on click outside
    $(document).on('click', function () {
        if ($(this).is('span') === false) {
            $('span.focus').removeClass('focus');
        }
    });
});

//context menu
// $(function() {
//     $.contextMenu({
//         selector: 'span',
//         items: {
//             'new': {
//                 name: 'New',
//                 icon: 'fa-clone',
//                 items: {
//                     'file': {name: 'File', icon: 'fa-file-o', callback: },
//                     'folder': {name: 'Folder', icon: 'fa-folder-o', callback: }
//                 }
//             },
//             'edit': {name: 'Edit', icon: 'edit', callback: },
//             'delete': {name: 'Delete', icon: 'delete', callback: }
//         }
//     });
// });