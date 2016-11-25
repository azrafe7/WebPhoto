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
      $("#discard_snapshot, #upload_snapshot, #api_url").show();
      snapshot.show();
      $("#show_stream").show();
	  
	  $("#filters").show();
	  applyFilters();
    };

    var clear_upload_data = function() {
      $("#upload_status, #upload_result").html("");
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
	
    var upload_snapshot = function() {
      var api_url = $("#api_url").val() || $("#api_url").attr("placeholder");

      /*if (!api_url.length) {
        $("#upload_status").html("Please provide URL for the upload");
        return;
      }*/

      clear_upload_data();
      //$("#loader").show();
      $("#upload_snapshot").prop("disabled", true);

      var snapshot = $(".item.selected").data("snapshot");
      
	  //snapshot.upload({api_url: api_url}).done(upload_done).fail(upload_fail);
	  download_canvas_as(snapshot._canvas, null, api_url);
	  
      $("#upload_snapshot").prop("disabled", false);
    };

    var upload_done = function(response) {
      $("#upload_snapshot").prop("disabled", false);
      $("#loader").hide();
      $("#upload_status").html("Upload successful");
      $("#upload_result").html(response);
    };

    var upload_fail = function(code, error, response) {
      $("#upload_snapshot").prop("disabled", false);
      $("#loader").hide();
      $("#upload_status").html(
        "Upload failed with status " + code + " (" + error + ")");
      $("#upload_result").html(response);
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
      clear_upload_data();
      camera.show_stream();
    };

    var hide_snapshot_controls = function() {
      $("#discard_snapshot, #upload_snapshot, #api_url").hide();
      $("#upload_result, #upload_status").html("");
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
    $("#upload_snapshot").click(upload_snapshot);
    $("#discard_snapshot").click(discard_snapshot);
    $("#show_stream").click(show_stream);
    $("#toggle_overlay").click(function() {$("#overlay").toggle();});

	$("#api_url").keyup(function(event){
		if (event.keyCode == 13){
			$("#upload_snapshot").click();
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
