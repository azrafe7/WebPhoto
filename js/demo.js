$(function() {
  if (window.JpegCamera) {
    var snaps = 3;
	var camera; // Initialized at the end

    var update_stream_stats = function(stats) {
      $("#stream_stats").html(
        "Mean luminance = " + stats.mean +
        "; Standard Deviation = " + stats.std);

      //setTimeout(function() {camera.get_stats(update_stream_stats);}, 1000);
    };

    var take_snapshots = function(count) {
      var snapshot = camera.capture();

      if (JpegCamera.canvas_supported()) {
        snapshot.get_canvas(add_snapshot);
      }
      else {
        // <canvas> is not supported in this browser. We'll use anonymous
        // graphic instead.
        var image = document.createElement("img");
        image.src = "../assets/no_canvas_photo.jpg";
        setTimeout(function() {add_snapshot.call(snapshot, image)}, 1);
      }

      if (count > 1) {
        setTimeout(function() {take_snapshots(count - 1);}, 500);
      }
    };

    var add_snapshot = function(element) {
      $(element).data("snapshot", this).addClass("item");

      var $container = $("#snapshots").append(element);
      var $camera = $("#camera");
      var camera_ratio = $camera.innerWidth() / $camera.innerHeight();

      var height = $container.height()
      element.style.height = "" + height + "px";
      element.style.width = "" + Math.round(camera_ratio * height) + "px";

      var scroll = $container[0].scrollWidth - $container.innerWidth();

      $container.animate({
        scrollLeft: scroll
      }, 200);
    };

    var select_snapshot = function () {
      $(".item").removeClass("selected");
      var snapshot = $(this).addClass("selected").data("snapshot");
      $("#discard_snapshot, #filename, button[id^=download_snapshot]").show();
      snapshot.show();
      $("#show_stream").show();
	  
	  $("#filters").show();
	  applyFilters();
    };

	var download_canvas_as = function(canvas, mime, default_name) {
		var mime = mime || "image/jpeg";
		var default_name = default_name || "snapshot";
		
		var dataURL = canvas.toDataURL(mime);
		var anchor = document.createElement("a");
		anchor.download = default_name;
		anchor.href = dataURL;
		anchor.dataset.downloadurl = [mime, anchor.download, anchor.href].join(":");
		
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	}
	
    var download_snapshot = function(imageType) {
      var filename = $("#filename").val() || $("#filename").attr("placeholder");

      $("button[id^=download_snapshot]").prop("disabled", true);

      var snapshot = $(".item.selected").data("snapshot");
      
	  var mime = imageType ? "image/" + imageType : null;
	  download_canvas_as(snapshot._canvas, mime, filename);
	  
      $("button[id^=download_snapshot]").prop("disabled", false);
    };

    var discard_snapshot = function() {
      var element = $(".item.selected").removeClass("item selected");

      var next = element.nextAll(".item").first();

      if (!next.size()) {
        next = element.prevAll(".item").first();
      }

      if (next.size()) {
        next.addClass("selected");
        next.data("snapshot").show();
      }
      else {
        hide_snapshot_controls();
      }

      element.data("snapshot").discard();

      element.hide("slow", function() {$(this).remove()});
    };

    var show_stream = function() {
      $(this).hide();
      $(".item").removeClass("selected");
      hide_snapshot_controls();
      camera.show_stream();
    };

    var hide_snapshot_controls = function() {
      $("#discard_snapshot, #filename, button[id^=download_snapshot]").hide();
      $("#show_stream").hide();
	  $("#filters").hide();
    };

	var add_overlay_canvas = function() {
		var overlay = document.createElement('canvas');
		overlay.setAttribute("id", "overlay");
		$("#camera div")[0].appendChild(overlay);
	}
	
	var draw_ellipse = function() {
		var overlay = document.getElementById("overlay");
		var ctx = overlay.getContext("2d");
		
		ctx.setLineDash([15, 5]);
		var w = overlay.width;
		var h = overlay.height;

		ctx.clearRect(0, 0, w, h);
		ctx.strokeStyle = "rgba(255, 255, 255, .75)";
		ctx.lineWidth = 5;
		ctx.beginPath();
		ctx.ellipse(w / 2, h / 2, w * .2, h * .38, 0, 0, 2 * Math.PI);
		ctx.stroke();
	}
	
	var reset = function() {
		show_stream();
		$("#snapshots .item").hide("slow", function() {
			$("#snapshots").empty();
			camera.discard_all();
			$("#show_stream").hide();
		});
	}
	
	var revertFilters = function() {
		$("#filters input").each(function() {
			$(this).val(0);
		});
		applyFilters();
	}
	
	var applyFilters = function() {
		var canvas = $("#camera canvas").get(-1);
		
		Caman(canvas, function() {
			var caman = this;
			caman.revert(false);
			
			$("#filters label").each(function() {
				var filterName = $(this).attr("for");
				var filterValue = parseInt($("#filters #" + filterName).val());
				$(this).text(filterName + " (" + filterValue + ")");
				
				caman[filterName](filterValue);
			});
			
			caman.render();
		});
	}
	$("#filters input").on("change", applyFilters);
	$("#revert").click(revertFilters);
	
    $("#take_snapshots").append(" (" + snaps + ")").click(function() {take_snapshots(snaps);});
    $("#snapshots").on("click", ".item", select_snapshot);
    $("#download_snapshot_jpeg").click(download_snapshot.bind(null, "jpeg"));
    $("#download_snapshot_png").click(download_snapshot.bind(null, "png"));
    $("#discard_snapshot").click(discard_snapshot);
    $("#show_stream").click(show_stream);
    $("#toggle_overlay").click(function() {$("#overlay").toggle();});

	$("#filename").keyup(function(event){
		if (event.keyCode == 13){
			$("#download_snapshot").click();
		}
	});

	$("#reset").click(reset);
	
    var options = {
      shutter_ogg_url: "../assets/shutter.ogg",
      shutter_mp3_url: "../assets/shutter.mp3",
      swf_url: "../assets/jpeg_camera.swf",
	  quality: 1.0,
	  mirror: true,
	  shutter: true,
    }

    camera = new JpegCamera("#camera", options).ready(function(info) {
      $("#reset").show();
      $("#take_snapshots").show();
	  $("#toggle_overlay").show();

      $("#camera_info").html(
        "Camera resolution: " + info.video_width + "x" + info.video_height);

      //get luminance and std stats in real time
	  //this.get_stats(update_stream_stats);
	  
	  add_overlay_canvas();
	  draw_ellipse();
    });
  }
});
