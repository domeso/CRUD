var crud_load_timer;

$(document).ready(function() {
    $(document)
        .on('click', '.crud .crud-sort', crud_sort)
        .on('click', '.crud .crud_reset', crud_reset)
        .on('click', '.crud .curd_deleted_option', crud_deleted)
        .on('click', '.crud .pagination li a', crud_page)
        .on('click', '.crud .crud_page_size_option', crud_page_size)
        .on('click', '.crud .crud_create_overlay', crud_create_overlay)
        .on('click', '.crud .crud_update_overlay', crud_update_overlay)
        .on('click', '.crud .crud_detail_overlay', crud_detail_overlay)
        .on('click', '.crud .crud_delete_overlay', crud_delete_overlay)
        .on('click', '.crud .crud_restore_overlay', crud_restore_overlay)
        .on('submit', '.modal-dialog form', crud_overlay_submit)
        .on('keyup', '.crud form input[type=text]', function(event) {
            if( event.keyCode == 13 ) {
                return crud_load();
            }
        });
});

function current_base_url() {
    var url = location.protocol + '//' + location.host + location.pathname + '?';
    url += 'page=' + $('.crud .crud_page_id').val();

    return url;
}

function hide_loading_progress() {
    $('.waitMe_container').waitMe('hide');

    return false;
}

function show_loading_progress( area ) {
    var element = $('.modal-content').length > 0 ? $('.modal-content').last() : $('.crud-card');

    if( area ) {
        if( area == 'main' ) {
            element = $('.crud-card');
        } else if( area == 'dialog' ) {
            element = $('.modal-content').last();
        }
    }

    element.waitMe({
        effect: 'timer',
        text: 'Lade ...',
        bg: 'rgba(255,255,255,0.90)',
        color: '#555'
    });

    return false;
}

function crud_load( reset ) {
    show_loading_progress('main');

    var url = location.protocol + '//' + location.host + location.pathname + '?';

    if( typeof reset == 'string' && reset === 'reset' ) {
        url += 'page=' + $('.crud .crud_page_id').val();
    } else {
        url += $('.crud form').serialize();
    }

    history.replaceState(null, "", url);

    url += '&crud[ajax]=load&cache=' + new Date().getTime() + '' + Math.random();

    $.get( url, function( data ) {
        $('.crud').html( $( data ).html() );

        hide_loading_progress();

        crud_init();
    });

    return false;
}

function crud_start_load_timer() {
    if( crud_load_timer ) clearTimeout( crud_load_timer );

    crud_load_timer = setTimeout( crud_load, 500);
}

function crud_reset() {
    return crud_load( 'reset' );
}

function actionUrl( action, id ) {
    var url = current_base_url() + '&crud[ajax]=' + action;

    if( id ) {
        url += '&crud[id]=' + id;
    }

    return url;
}

function crud_load_overlay( url, params ) {
    var asyc = function( data ) {
        if( $(data).attr('role') !== 'dialog' ) {
            console.log(data);
            alert('Fehler beim laden des Overlays!');
            hide_loading_progress();
            return false;
        }

        var id = $(data).attr('id');
        var form = $('#'+id+' form');

        if( form.length > 0 ) {
            var newForm = $('form',data);

            form.html( newForm.html() );
            form.attr( 'action', newForm.attr( 'action') );

            var notify = $('.crud-notification', data);
            if( notify.length > 0 ) {
                notification(notify.html(),notify.attr('data-type'));
            }
        } else {
            $('body').append($(data).modal({
                keyboard: false,
                backdrop: 'static',
                show: true
            }).on('hidden.bs.modal', function(e) {
                $(this).remove();
            }));
        }

        hide_loading_progress();

        if( $(data).attr('data-refresh') == 1 ) {
            $('#'+id).off('hidden.bs.modal').on('hidden.bs.modal', function(e) {
                crud_load();
                $(this).remove();
            });
        }

        if( $(data).attr('data-close') == 1 ) {
            $('#'+id).modal('hide');
        } else {
            crud_init();
        }
    };

    if( typeof params == 'object' && params.length > 0 ) {
        show_loading_progress();
        $.post( url, params, asyc );
    } else {
        show_loading_progress();
        $.get( url, params, asyc );
    }

    return false;
}

function crud_overlay_submit() {
    var form = $(this);
    var url = form.attr('action');
    var id = form.find('#field-id').val();

    if( id ) {
        url += '&crud[id]=' + id;
    }

    crud_load_overlay( url, form.serializeArray() );

    return false;
}

function crud_create_overlay() {
    return crud_load_overlay( actionUrl('create') );
}

function crud_update_overlay() {
    var id = $(this).closest('.dropdown-menu').attr('data-id');

    return crud_load_overlay( actionUrl('update', id) );
}

function crud_detail_overlay() {
    var id = $(this).closest('.dropdown-menu').attr('data-id');

    return crud_load_overlay( actionUrl('detail', id) );
}

function crud_delete_overlay() {
    var id = $(this).closest('.dropdown-menu').attr('data-id');

    return crud_load_overlay( actionUrl('delete', id) );
}

function crud_restore_overlay() {
    var id = $(this).closest('.dropdown-menu').attr('data-id');

    return crud_load_overlay( actionUrl('restore', id) );
}


function crud_deleted() {
    var element = $('.crud .curd_deleted_option i');
    var deletedOption = $('.crud .crud_deleted');

    if( element.html() == 'check_box' ) {
        element.html('check_box_outline_blank');
    } else {
        element.html('check_box');
    }

    deletedOption.val( deletedOption.val() == 1 ? 0 : 1 );

    crud_start_load_timer();

    return false;
}

function crud_page_size() {
    var $this = $(this);
    var page_size = $this.attr('data-page-size');

    $('.crud .crud_page_size').val( page_size );

    $('.crud .crud_page_size_option i').html( 'radio_button_unchecked' );
    $this.find('i').html( 'radio_button_checked' );

    crud_start_load_timer();

    return false;
}

function crud_page() {
    var page = $(this).attr('data-page');

    $('.crud .crud_page').val(page);

    $('.crud .pagination .active').removeClass('active');

    $(this).parent().addClass('active');

    crud_start_load_timer();

    return false;
}

function crud_sort() {
    var $this = $(this);

    var field = $this.attr('data-field');
    var direction = $this.attr('data-dir');

    $('.crud .crud-sort').removeClass('active');
    $this.addClass('active');

    if( direction == 'DESC' ) {
        $this.attr('data-dir', 'ASC');
        $this.find('i').removeClass('mirror-v');
    } else {
        $this.attr('data-dir', 'DESC');
        $this.find('i').addClass('mirror-v');
    }

    $('.crud .crud_sort_field').val( field );

    $('.crud .crud_sort_dir').val( direction );

    crud_load();

    return false;
}