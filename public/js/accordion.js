$(document).ready(function() {
  $(".ui.box.accordion .title").click(function(e) {
    var targ = $(e.currentTarget).data("expand");
    if (navigator.vibrate) navigator.vibrate(10);
    $(".ui.box.accordion .content[data-expand="+targ+"]").toggle("fast");
  });
});