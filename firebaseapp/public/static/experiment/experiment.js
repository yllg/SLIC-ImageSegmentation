function getActiveStyle(styleName, object) {
  object = object || canvas.getActiveObject();
  if (!object) return '';

  return (object.getSelectionStyles && object.isEditing)
    ? (object.getSelectionStyles()[styleName] || '')
    : (object[styleName] || '');
}

function setActiveStyle(styleName, value, object) {
  object = object || canvas.getActiveObject();
  if (!object) return;

  if (object.setSelectionStyles && object.isEditing) {
    var style = { };
    style[styleName] = value;
    object.setSelectionStyles(style);
    object.setCoords();
  }
  else {
    object[styleName] = value;
  }

  object.setCoords();
  canvas.renderAll();
}

function getActiveProp(name) {
  var object = canvas.getActiveObject();
  if (!object) return '';
  return object[name] || '';
}

function setActiveProp(name, value) {
  var object = canvas.getActiveObject();
  if (!object) return;
  object.set(name, value).setCoords();
  canvas.renderAll();
}



function addAccessors($scope) {

  $scope.getOpacity = function() {
    return getActiveStyle('opacity') * 100;
  };
  $scope.setOpacity = function(value) {
    setActiveStyle('opacity', parseInt(value, 10) / 100);
  };

  $scope.getScale = function() {
    return (getActiveStyle('scaleX')+getActiveStyle('scaleY')) * 50;
  };
  $scope.setScale = function(value) {
    setActiveStyle('scaleX', parseInt(value, 10) / 100);
    setActiveStyle('scaleY', parseInt(value, 10) / 100);
  };

  $scope.confirmClear = function() {
    if (confirm('Remove everything including images. Are you sure?')) {
      canvas.clear();
    }
  };

  $scope.confirmClearMasks = function() {
    if (confirm('Remove all masks. Are you sure?')) {
        canvas.forEachObject(function(obj){
            if (!obj.isType('image')){
                obj.remove()
            }
        });
    state.masks_present = false;
    }
  };

  $scope.showTour = function(){
      hopscotch.startTour(tour);
  };

  $scope.showDev = function(){
      $scope.dev = !$scope.dev;
  };

  $scope.getDev = function(){
      return $scope.dev
  };

  $scope.getFill = function() {
    return getActiveStyle('fill');
  };
  $scope.setFill = function(value) {
    setActiveStyle('fill', value);
  };

  $scope.getBgColor = function() {
    return getActiveProp('backgroundColor');
  };
  $scope.setBgColor = function(value) {
    setActiveProp('backgroundColor', value);
  };


  $scope.getStrokeColor = function() {
    return getActiveStyle('stroke');
  };
  $scope.setStrokeColor = function(value) {
    setActiveStyle('stroke', value);
  };

  $scope.getStrokeWidth = function() {
    return getActiveStyle('strokeWidth');
  };
  $scope.setStrokeWidth = function(value) {
    setActiveStyle('strokeWidth', parseInt(value, 10));
  };

  $scope.getCanvasBgColor = function() {
    return canvas.backgroundColor;
  };

  $scope.setCanvasBgColor = function(value) {
    canvas.backgroundColor = value;
    canvas.renderAll();
  };

$scope.exportNetwork =function(){
    $scope.network_json = JSON.stringify(state.net.toJSON());
};

$scope.export = function() {
    if (!fabric.Canvas.supports('toDataURL')) {
      alert('This browser doesn\'t provide means to serialize canvas to an image');
    }
    else {
      fabric.Image.fromURL(output_canvas.toDataURL(), function(img) {
            canvas.add(img);
            img.bringToFront();
            canvas.renderAll();
            state.recompute = true;
        });
    }
  };


  $scope.download = function() {
    if (!fabric.Canvas.supports('toDataURL')) {
      alert('This browser doesn\'t provide means to serialize canvas to an image');
    }
    else {
      window.open(output_canvas.toDataURL('png'));
    }
  };

  $scope.getSelected = function() {
    return canvas.getActiveObject() || canvas.getActiveGroup();
  };

  $scope.removeSelected = function() {
    var activeObject = canvas.getActiveObject(),
        activeGroup = canvas.getActiveGroup();
    if (activeGroup) {
      var objectsInGroup = activeGroup.getObjects();
      canvas.discardActiveGroup();
      objectsInGroup.forEach(function(object) {
        canvas.remove(object);
      });
    }
    else if (activeObject) {
      canvas.remove(activeObject);
    }
  };


$scope.resetZoom = function(){
    var newZoom = 1.0;
    canvas.absolutePan({x:0,y:0});
    canvas.setZoom(newZoom);
    state.recompute = true;
    renderVieportBorders();
    console.log("zoom reset")
    return false;
};

$scope.sendBackwards = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendBackwards(activeObject);
    }
};

  $scope.sendToBack = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendToBack(activeObject);
    }
  };

  $scope.bringForward = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringForward(activeObject);
    }
  };

  $scope.bringToFront = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringToFront(activeObject);
    }
  };

  function initCustomization() {
    if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent)) {
      fabric.Object.prototype.cornerSize = 30;
    }
    fabric.Object.prototype.transparentCorners = false;
    if (document.location.search.indexOf('guidelines') > -1) {
      initCenteringGuidelines(canvas);
      initAligningGuidelines(canvas);
    }
  }
  initCustomization();



  $scope.getFreeDrawingMode = function(mode) {
      if (mode){
        return canvas.isDrawingMode == false || mode != $scope.current_mode ? false : true;
      }
      else{
          return canvas.isDrawingMode
      }

  };

mover_cursor = function(options) {yax.css({'top': options.e.y + delta_top,'left': options.e.x + delta_left});};


  $scope.setFreeDrawingMode = function(value,mode) {
    canvas.isDrawingMode = !!value;
    canvas.freeDrawingBrush.color = mode == 1 ? 'green': 'red';
    if (value && mode == 1){
        $scope.status = "Drawing foreground, click segment to update results."
    }else if(value){
        $scope.status = "Drawing background, click segment to update results."
    }
    if(canvas.isDrawingMode){
        yax.show();
        canvas.on('mouse:move',mover_cursor);
    }
   else{
        yax.hide();
        canvas.off('mouse:move',mover_cursor);
    }
    canvas.freeDrawingBrush.width = 5;
    $scope.current_mode = mode;
    canvas.deactivateAll().renderAll();
    $scope.$$phase || $scope.$digest();
  };

  $scope.freeDrawingMode = 'Pencil';

  $scope.getDrawingMode = function() {
    return $scope.freeDrawingMode;
  };

  $scope.setDrawingMode = function(type) {
    $scope.freeDrawingMode = type;
    $scope.$$phase || $scope.$digest();
  };

  $scope.getDrawingLineWidth = function() {
    if (canvas.freeDrawingBrush) {
      return canvas.freeDrawingBrush.width;
    }
  };

  $scope.setDrawingLineWidth = function(value) {
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = parseInt(value, 10) || 1;
    }
  };

  $scope.getDrawingLineColor = function() {
    if (canvas.freeDrawingBrush) {
      return canvas.freeDrawingBrush.color;
    }
  };
  $scope.setDrawingLineColor = function(value) {
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = value;
    }
  };


  $scope.duplicate = function(){
    var obj = fabric.util.object.clone(canvas.getActiveObject());
        obj.set("top", obj.top+12);
        obj.set("left", obj.left+9);
        canvas.add(obj);
  };


  $scope.load_image = function(){
    var input, file, fr, img;
    state.recompute = true;
    input = document.getElementById('imgfile');
    input.click();
  };

$scope.updateCanvas = function () {
    fabric.Image.fromURL(output_canvas.toDataURL('png'), function(oImg) {
        canvas.add(oImg);
    });
};

$scope.labelUnknown = function(){
    var segments = state.results.segments;
    if(!state.results.background.length||!state.results.background.length ) {
        console.log("Please mark both Background and Foreground");
        _.each(state.results.unknown,function(k){segments[k].foreground = true});
        return
    }
    for(var index = 0; index < state.results.unknown.length; index++) {

        seg = segments[state.results.unknown[index]];
        seg.foreground = true;
        var fgList = _.map(state.results.foreground,function(e){
            return seg.edges[e] * (Math.abs(segments[e].mp[0] - seg.mp[0])
                + Math.abs(segments[e].mp[1] - seg.mp[1])
                + Math.abs(segments[e].mp[2] - seg.mp[2]))});
        var bgList = _.map(state.results.background,function(e){
            return seg.edges[e] * (Math.abs(segments[e].mp[0] - seg.mp[0])
                + Math.abs(segments[e].mp[1] - seg.mp[1])
                + Math.abs(segments[e].mp[2] - seg.mp[2]))});
        var fgDist = Math.min.apply(null, fgList); // _.reduce(fgList, function(memo, num){ return memo + num; }, 0) / fgList.length;
        var bgDist = Math.min.apply(null, bgList); //_.reduce(bgList, function(memo, num){ return memo + num; }, 0) / bgList.length;
        if (fgDist > bgDist){
            seg.foreground = false;
            seg.background = true
        }
        //console.log([state.results.unknown[index],seg.foreground,bgDist,fgDist,bgList.length,fgList.length].join())
    }
};

$scope.labelMixed = function(){
};

$scope.updateClusters = function(){
    var mask = state.mask_data.data,
        pixels = state.canvas_data.data,
        segments = state.results.segments,
        indexMap = state.results.indexMap,
        w = width,
        x,
        y;
    state.results.unknown = [];
    state.results.mixed = [];
    state.results.foreground = [];
    state.results.background = [];
    for(var s in segments) {
        seg = segments[s];
        seg.mask = { 'f':0,'b':0};
        seg.foreground = false;
        seg.background = false;
        seg.unknown = false;
        seg.mixed = false;
    }

    for (var i = 0; i < indexMap.length; ++i) {
        var value = indexMap[i];
            if (mask[4 * i + 0] == 0 && mask[4 * i + 1] == 128)
            {
                segments[value].mask.f++;
                state.train_data.push([new convnetjs.Vol([pixels[4 * i],pixels[4 * i + 1],pixels[4 * i + 2]]),1]);
            }
            if (mask[4 * i + 0] > 0 && mask[4 * i + 1] == 0)
            {
                state.train_data.push([new convnetjs.Vol([pixels[4 * i],pixels[4 * i + 1],pixels[4 * i + 2]]),0]);
                segments[value].mask.b++;
            }
    }
    for(var s in segments){
        seg = segments[s];
        if (seg.mask.f > 0 && seg.mask.b == 0){
            seg.foreground = true;
            seg.background = false;
            seg.unknown = false;
            seg.mixed = false;
            state.results.foreground.push(s)
        }
        else if (seg.mask.b > 0 && seg.mask.f == 0){
            seg.foreground = false;
            seg.background = true;
            seg.unknown = false;
            seg.mixed = false;
            state.results.background.push(s)
        }
        else if (seg.mask.b > 0 && seg.mask.f > 0){
            seg.foreground = false;
            seg.background = false;
            seg.unknown = false;
            seg.mixed = true;
            state.results.mixed.push(s)
        }
        else{
            seg.unknown = true;
            state.results.unknown.push(s)
        }
    }
    $scope.labelUnknown();
};

$scope.renderSuperpixels = function(){
    var results = state.results;
    var context = output_canvas.getContext('2d');
    var imageData = context.createImageData(output_canvas.width, output_canvas.height);
    var data = imageData.data;
    var seg;
    for (var i = 0; i < results.indexMap.length; ++i) {
            seg = results.segments[results.indexMap[i]];
            data[4 * i + 3] = 255;
            if (results.indexMap[i]== results.indexMap[i+1]){  // Extremely naive pixel bondary
                data[4 * i + 0] = seg.mp[0];
                data[4 * i + 1] = seg.mp[1];
                data[4 * i + 2] = seg.mp[2];
            }
            else{
                data[4 * i + 0] = 0;
                data[4 * i + 1] = 0;
                data[4 * i + 2] = 0;
            }
    }
    context.putImageData(imageData, 0, 0);
};

$scope.renderMixed = function(){
    var results = state.results;
    var context = output_canvas.getContext('2d');
    var imageData = context.createImageData(output_canvas.width, output_canvas.height);
    var data = imageData.data;
    for (var i = 0; i < results.indexMap.length; ++i) {
        if (results.segments[results.indexMap[i]].mixed)
        {
            data[4 * i + 0] = results.rgbData[4 * i + 0];
            data[4 * i + 1] = results.rgbData[4 * i + 1];
            data[4 * i + 2] = results.rgbData[4 * i + 2];
            data[4 * i + 3] = 255;
        }
        else{
            data[4 * i + 3] = 0;
        }
    }
    context.putImageData(imageData, 0, 0);

};

$scope.renderUnknown = function(){
    var results = state.results;
    var context = output_canvas.getContext('2d');
    var imageData = context.createImageData(output_canvas.width, output_canvas.height);
    var data = imageData.data;
    for (var i = 0; i < results.indexMap.length; ++i) {
        if (results.segments[results.indexMap[i]].unknown)
        {
            data[4 * i + 0] = results.rgbData[4 * i + 0];
            data[4 * i + 1] = results.rgbData[4 * i + 1];
            data[4 * i + 2] = results.rgbData[4 * i + 2];
            data[4 * i + 3] = 255;
        }
        else{
            data[4 * i + 3] = 0;
        }
    }
    context.putImageData(imageData, 0, 0);
};

var callbackSegmentation  = function(results){
        results.segments = {};

        var w = width,
            h = height;
            l = results.indexMap.length;
        for (var i = 0; i < l; ++i) {
            var current = results.indexMap[i];
            if (!results.segments.hasOwnProperty(current))
            {
                results.segments[current] = {
                    'min_pixel':i,
                    'max_pixel':i,
                    'min_x':w+1,
                    'min_y':h+1,
                    'max_x':-1,
                    'max_y':-1,
                    'mask':{'b':0,'f':0},
                    'count':0,
                    'mp':[0,0,0],
                    }
            }
            var y = Math.floor(i/w), x = (i % w);
            if (i != x + y*w)
            {
                console.log(["Error?",i,x + y*w])
            }

            results.segments[current].count += 1;
            results.segments[current].mp[0] += results.rgbData[4 * i];
            results.segments[current].mp[1] += results.rgbData[4 * i + 1];
            results.segments[current].mp[2] += results.rgbData[4 * i + 2];
            results.segments[current].max_pixel = i;
            if (x > results.segments[current].max_x){
                results.segments[current].max_x = x
            }
            if (x < results.segments[current].min_x){
                results.segments[current].min_x = x
            }
            if (y > results.segments[current].max_y){
                results.segments[current].max_y = y
            }
            if (y < results.segments[current].min_y){
                results.segments[current].min_y = y
            }
        }
        for(var s in results.segments){
            results.segments[s].mp[0] =  results.segments[s].mp[0] /results.segments[s].count;
            results.segments[s].mp[1] =  results.segments[s].mp[1] /results.segments[s].count;
            results.segments[s].mp[2] =  results.segments[s].mp[2] /results.segments[s].count;
            results.segments[s].edges = {};
            for(var k in results.segments){
                if (s != k){
                    results.segments[s].edges[k] = 1.0;
                    //    0.5 * (Math.abs(results.segments[s].min_x - results.segments[k].min_x) +
                    //Math.abs(results.segments[s].min_y - results.segments[k].min_y) +
                    //Math.abs(results.segments[s].max_x - results.segments[k].max_x) +
                    //Math.abs(results.segments[s].max_y - results.segments[k].max_y))
                }
            }
        }
        state.results = results;
};

$scope.deselect = function(){
    canvas.deactivateAll().renderAll();
    $scope.$$phase || $scope.$digest();
};



$scope.renderResults = function(){
    var results = state.results;
    var context = output_canvas.getContext('2d');
    var imageData = context.createImageData(output_canvas.width, output_canvas.height);
    var data = imageData.data;
    for (var i = 0; i < results.indexMap.length; ++i) {
        if (results.segments[results.indexMap[i]].foreground)
        {
            data[4 * i + 0] = results.rgbData[4 * i + 0];
            data[4 * i + 1] = results.rgbData[4 * i + 1];
            data[4 * i + 2] = results.rgbData[4 * i + 2];
            data[4 * i + 3] = 255;
        }
        else{
            data[4 * i + 3] = 0;
        }
    }
    context.putImageData(imageData, 0, 0);
};




$scope.refreshData = function(){
    if (state.recompute){
        canvas.deactivateAll().renderAll();
        canvas.forEachObject(function(obj){
            if (!obj.isType('image')){
                obj.opacity = 0;
            }
        });
        canvas.renderAll();
        state.canvas_data = canvas.getContext('2d').getImageData(0, 0, height, width);
    }
    else{
        console.log("did not recompute")
    }
    canvas.forEachObject(function(obj){
        if (!obj.isType('image')){
            obj.opacity = 1.0;
        }
        else{
            obj.opacity = 0;
        }
    });
    canvas.renderAll();
    state.mask_data = canvas.getContext('2d').getImageData(0, 0, height, width);
    canvas.forEachObject(function(obj){
        if (obj.isType('image'))
        {
            obj.opacity = 1.0;
        }
        else{
            obj.opacity = 0.6;
        }
    });
    canvas.renderAll();
};

$scope.checkStatus = function(){
    return $scope.status;
};

$scope.disableStatus = function(){
    $scope.status = "";
};

$scope.check_movement = function(){
    // set image positions or check them
    if ($scope.dev){
        // Always recompute if dev mode is enabled.
        state.recompute = true;
    }
    canvas.forEachObject(function(obj){
        if (!obj.isType('image')){
            state.masks_present = true;
        }
    });
    old_positions_joined = state.images.join();
    state.images = [];
    canvas.forEachObject(function(obj){
        if (obj.isType('image')){
            state.images.push([obj.scaleX,obj.scaleY,obj.top,obj.left,obj.opacity])
        }
    });
    if(!state.recompute) // if recompute is true let it remain true.
    {
        state.recompute = state.images.join() != old_positions_joined;
    }
};


$scope.segment = function () {
    $scope.setFreeDrawingMode(false,$scope.current_mode);
    $scope.check_movement();
    if (state.masks_present) {
        $scope.status = "Starting segementation";
        if(canvas.isDrawingMode){
            canvas.isDrawingMode = false;
            canvas.deactivateAll().renderAll();
        }
        $scope.$$phase || $scope.$digest();
        $scope.refreshData();
        if (state.recompute)
        {
            state.options.slic.callback = callbackSegmentation;
            SLICSegmentation(state.canvas_data, state.mask_data, state.options.slic);
            console.log("recomputing segmentation")
        }
        else{
            console.log("Did not recompute, using previously computed superpixels.")
        }
        $scope.updateClusters();
        $scope.train();
        $scope.status = "Segmentation completed";
        state.recompute = false;
    }
    else {
        $scope.status = "Please mark background and foreground !! "
    }
};

$scope.initialize_net = function(){
    eval(network_editor.getValue());
};


$scope.train = function (){
    $scope.initialize_net();
    console.time("training");
    eval(network_train_editor.getValue());
    console.timeEnd("training");
    debugger;
    var results = state.results;
    var context = output_canvas.getContext('2d');
    var imageData = context.createImageData(output_canvas.width, output_canvas.height);
    var idata = imageData.data;
    var pixels = state.canvas_data.data;
    var w = width;
    var x,y;
    console.time("evaluation");
    eval(network_test_editor.getValue());
    console.timeEnd("evaluation");
    debugger;
    context.putImageData(imageData, 0, 0);
};



$scope.addOnClick = function(event) {
		if ( event.layerX ||  event.layerX == 0) { // Firefox
			mouseX = event.layerX ;
			mouseY = event.layerY;
		} else if (event.offsetX || event.offsetX == 0) { // Opera
			mouseX = event.offsetX;
			mouseY = event.offsetY;
		}
        if (state.results)
        {
        var segment = state.results.segments[state.results.indexMap[width*mouseY+mouseX]],
            segment_index = state.results.indexMap[width*mouseY+mouseX],
            c = document.createElement('canvas');
        c.setAttribute('id', '_temp_canvas');
        c.width = segment.max_x - segment.min_x + 1;
        c.height = segment.max_y - segment.min_y + 1;
        var context = c.getContext('2d'),
            imageData = context.createImageData(c.width, c.height),
            data = imageData.data,
            indexMap = state.results.indexMap,
            rgbData = state.canvas_data.data;
        var i_x,i_y;
        k = 0;
        for (var i = 0; i < indexMap.length; ++i)
        {
            i_y = Math.floor(i/width);
            i_x = (i % width);
            if (i_x >= segment.min_x && i_x <= segment.max_x && i_y >= segment.min_y && i_y <= segment.max_y)
            {
                if (segment_index == indexMap[i]){
                        data[4 * k + 0] = rgbData[4 * i + 0];
                        data[4 * k + 1] = rgbData[4 * i + 1];
                        data[4 * k + 2] = rgbData[4 * i + 2];
                        data[4 * k + 3] = 255;
                }
                else
                {
                    data[4 * k + 0] = 0;
                    data[4 * k + 1] = 0;
                    data[4 * k + 2] = 0;
                    data[4 * k + 3] = 0;
                }
                k++;
            }
        }
        context.putImageData(imageData, 0, 0);
        fabric.Image.fromURL(c.toDataURL(), function(img) {
            img.left = segment.min_x;
            img.top = segment.min_y;
            canvas.add(img);
            img.bringToFront();
            c = null;
            $('#_temp_canvas').remove();
            canvas.renderAll();
        });
        }
    }
}

function watchCanvas($scope) {

  function updateScope() {
    $scope.$$phase || $scope.$digest();
    canvas.renderAll();
  }

  canvas
    .on('object:selected', updateScope)
    .on('group:selected', updateScope)
    .on('path:created', updateScope)
    .on('selection:cleared', updateScope);
}



cveditor.controller('CanvasControls', function($scope) {
    $scope.yax = $('#yaxis');
    $scope.canvas = canvas;
    $scope.output_canvas = output_canvas;
    $scope.getActiveStyle = getActiveStyle;
    $scope.dev = false;
    $scope.status = "Note: Images are not uploaded to server, all processing is performed within the browser.";
    $scope.current_mode = null;
    $scope.network_json = ""
    addAccessors($scope);
    addAccessors($scope);
    watchCanvas($scope);
});
