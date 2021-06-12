

$(document).ready(function() {

  var pathname = window.location.pathname;
  if (pathname.charAt(pathname.length-1) === "/") pathname = pathname.substr(0, -1);
    console.log(pathname);
  if (pathname.indexOf("/sint2015/") === 0) {

    var surprisedata = { "francine": {name:"Francine", surprisename:"Amber"},
                         "marc": {name:"Marc", surprisename:"Frans"},
                         "frans": {name:"Frans", surprisename:"Sylvia"},
                         "sylvia": {name:"Sylvia", surprisename:"Jade"},
                         "amber": {name:"Amber", surprisename:"Marc"},
                         "jade": {name:"Jade", surprisename:"Francine"},
                        };

    var name = pathname.substr("/sint2015/".length).toLowerCase();

    if (name in surprisedata) {
      var surprise = surprisedata[name];
      $('.name').html(surprise.name);
      $('.surprisename').html(surprise.surprisename);
      $('.unknown').addClass('hide');
      $('.welcome').removeClass('hide');
    }
  }

  $('.welcome a').click(function(e) {
    $('.welcome').addClass('hide');
    $('.surprise').removeClass('hide');
    e.stopPropagation();
    e.preventDefault();
  });

  $('.surprise a').click(function(e) {
    $('.surprise').addClass('hide');
    $('.welcome').removeClass('hide');
    e.stopPropagation();
    e.preventDefault();
  });

});
