/**
 * Created by aub3 on 5/1/15.
 */
var canvas = new fabric.Canvas('canvas'),
    output_canvas = document.getElementById('output_canvas'),

    width = canvas.getWidth(),
    height = canvas.getHeight(),
    jqwindow = $(window),
    delta_left = 0,
    delta_top = 0,
    yax = $('#yaxis'),
    state = {
        'images':[],
        'masks_present':false,
        'recompute':true,
        'results':{},
        'train_data':[],
        net:null,
        canvas_data:null,
        mask_data:null,
        'options':{
            'pf':null,
            'slic':null
        }
    },
    network_editor,network_train_editor,network_test_editor;


initialize_ui = function () {
    var jsfeat_gui = new dat.GUI({ autoPlace: false });
    var pf_opt, slic_opt;
    //pf_opt = function () {
    //this.sigma = 0;
    //this.threshold = 1000;
    //this.minSize = 1000;
    //};
    slic_opt = function () {
    this.regionSize = 30;
    this.minSize = 20;
    };
    //state.options.pf = new pf_opt();
    state.options.slic = new slic_opt();
    var slic_gui = jsfeat_gui.addFolder('Superpixel Segmentation');
    slic_gui.add(state.options.slic, "regionSize", 20, 400);
    slic_gui.add(state.options.slic, "minSize", 2, 100);
    //var pf_gui = jsfeat_gui.addFolder('PF Graph Segmentation (Not Used)');
    //pf_gui.add(state.options.pf, "threshold", 20, 40000);
    //pf_gui.add(state.options.pf, "sigma", 0, 20);
    //pf_gui.add(state.options.pf, "minSize", 2, 10000);
    $("#dat_gui").append(jsfeat_gui.domElement);
    canvas.backgroundColor = '#ffffff';
    $('#bg-color').val('#ffffff');
    canvas.renderAll();
    yax.hide();
    $('#imgfile').on("change",function(){
        file = this.files[0];
        fr = new FileReader();
        fr.onload = function () {
            img = new Image();
            img.onload = function () {
                fabric.Image.fromURL(img.src, function (oImg) {
                canvas.add(oImg);
                });
            };
            img.src = fr.result;
        };
        fr.readAsDataURL(file);
    });
      delta_left = $('#output_canvas').offset().left - $('#canvas').offset().left + jqwindow.scrollLeft();
      delta_top = $('#output_canvas').offset().top - $('#canvas').offset().top + jqwindow.scrollTop();
    jqwindow.scroll(function () {
      delta_left = $('#output_canvas').offset().left - $('#canvas').offset().left + jqwindow.scrollLeft();
      delta_top = $('#output_canvas').offset().top - $('#canvas').offset().top + jqwindow.scrollTop();
    });
    network_editor = ace.edit("network");
    network_editor.getSession().setMode("ace/mode/javascript");
    network_train_editor = ace.edit("network_train");
    network_train_editor.getSession().setMode("ace/mode/javascript");
    network_test_editor = ace.edit("network_test");
    network_test_editor.getSession().setMode("ace/mode/javascript");
    network_editor.setValue("layer_defs = [];\n\
\layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:3});\n\
layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});\n\
layer_defs.push({type:'softmax', num_classes:2});\n\
\n\
state.net = new convnetjs.Net();\n\
state.net.makeLayers(layer_defs);\n\
\n\
state.trainer = new convnetjs.SGDTrainer(state.net, {\n\
method:'adadelta',\n\
 batch_size:4,\n\
 l2_decay:0.01});",1);
    network_train_editor.setValue("var data = _.shuffle(state.train_data),\n\
    predicted;\n\
for (var index = 0 ; index <data.length;index++){\n\
    state.trainer.train(data[index][0],data[index][1]);\n\
}",1);
    network_test_editor.setValue("for (var i = 0; i < results.indexMap.length; ++i) {\n\
    x = new convnetjs.Vol([pixels[4*i],pixels[4*i+1],pixels[4*i+2]]);\n\
    y = state.net.forward(x).w;\n\
    if (y[1] > y[0]){  // naive \n\
        idata[4 * i + 0] = pixels[4*i];\n\
        idata[4 * i + 1] = pixels[4*i + 1];\n\
        idata[4 * i + 2] = pixels[4*i + 2];\n\
        idata[4 * i + 3] = 255;\n\
    }\n\
    else{\n\
        idata[4 * i + 0] = 0;\n\
        idata[4 * i + 1] = 0;\n\
        idata[4 * i + 2] = 0;\n\
        idata[4 * i + 3] = 0;\n\
    }\n\
}",1);
    fabric.Image.fromURL("/static/img/demo.jpg", function(oImg){canvas.add(oImg);},load_options = {crossOrigin:"Anonymous"});
};






    function renderVieportBorders() {
      var ctx = canvas.getContext();
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(
        canvas.viewportTransform[4],
        canvas.viewportTransform[5],
        canvas.getWidth() * canvas.getZoom(),
        canvas.getHeight() * canvas.getZoom());
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        canvas.viewportTransform[4],
        canvas.viewportTransform[5],
        canvas.getWidth() * canvas.getZoom(),
        canvas.getHeight() * canvas.getZoom());
      ctx.restore();
    }



(function() {
    $(canvas.getElement().parentNode).on('mousewheel', function(e) {
      var newZoom = canvas.getZoom() + e.deltaY / 300;
        if (newZoom > 0.1 && newZoom < 10){
            canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, newZoom);
            state.recompute = true;
            renderVieportBorders();
        }
      return false;
    });

    var viewportLeft = 0,
        viewportTop = 0,
        mouseLeft,
        mouseTop,
        _drawSelection = canvas._drawSelection,
        isDown = false;

    canvas.on('mouse:down', function(options) {
      isDown = true;
      viewportLeft = canvas.viewportTransform[4];
      viewportTop = canvas.viewportTransform[5];
      mouseLeft = options.e.x;
      mouseTop = options.e.y;
      if (options.e.altKey) {
        _drawSelection = canvas._drawSelection;
        canvas._drawSelection = function(){ };
      }
      renderVieportBorders();
    });

    canvas.on('mouse:move', function(options) {
      if (options.e.altKey && isDown) {
        var currentMouseLeft = options.e.x;
        var currentMouseTop = options.e.y;
        var deltaLeft = currentMouseLeft - mouseLeft,
            deltaTop = currentMouseTop - mouseTop;
        canvas.viewportTransform[4] = viewportLeft + deltaLeft;
        canvas.viewportTransform[5] = viewportTop + deltaTop;
        canvas.renderAll();
        renderVieportBorders();
      }
    });

    canvas.on('mouse:up', function() {
      canvas._drawSelection = _drawSelection;
      isDown = false;
    });
  })();

(function() {
  fabric.util.addListener(fabric.window, 'load', function() {
    var canvas = this.__canvas || this.canvas,
        canvases = this.__canvases || this.canvases;

    canvas && canvas.calcOffset && canvas.calcOffset();

    if (canvases && canvases.length) {
      for (var i = 0, len = canvases.length; i < len; i++) {
        canvases[i].calcOffset();
      }
    }
  });
})();

$(document).ready(function(){
    initialize_ui();
    $('#introModal').modal();
});


