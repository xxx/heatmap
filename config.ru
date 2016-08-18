def process_request
  begin
    yield
  rescue Errno::ENOENT
    [404, {'Content-Type' => 'text/plain'}, ['File not found']]
  rescue Exception
    [500, {'Content-Type' => 'text/plain'}, ['Internal server error']]
  end
end

run Proc.new { |env|
  if env['REQUEST_URI'] =~ %r!/([^./]+.jpg)/?\z!
    process_request do
      [200, {'Content-Type' => 'image/jpeg'}, [File.read($1)]]
    end
  elsif env['REQUEST_URI'] =~ %r!/([^./]+.js)/?\z!
    process_request do
      [200, {'Content-Type' => 'text/javascript'}, [File.read($1)]]
    end
  else
    [200, {'Content-Type' => 'text/html'}, [File.read('heatmap.html')]]
  end
}


