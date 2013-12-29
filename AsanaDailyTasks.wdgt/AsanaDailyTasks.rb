#!/usr/bin/env ruby

require "rubygems"
require "JSON"
require "net/https"

api_key = ARGV[0]
qstatus = ARGV[1]

output = []

#
# Get workspaces
# 

uri = URI.parse("https://app.asana.com/api/1.0/workspaces")
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_PEER
header = {
  "Content-Type" => "application/json"
}
req = Net::HTTP::Get.new(uri.request_uri, header)
req.basic_auth(api_key, '')
res = http.start { |http| http.request(req) }
wbody = JSON.parse(res.body)
if wbody['errors'] then
	abort("Server returned an error: #{wbody['errors'][0]['message']}")
end

wbody['data'].each { |workspace|
	workspace_id = workspace['id']
	workspace_name = workspace['name']
	#
	# Get tasks
	# 

	uri = URI.parse("https://app.asana.com/api/1.0/tasks?workspace=#{workspace_id}&assignee=me")
	http = Net::HTTP.new(uri.host, uri.port)
	http.use_ssl = true
	http.verify_mode = OpenSSL::SSL::VERIFY_PEER
	header = {
	  "Content-Type" => "application/json"
	}
	req = Net::HTTP::Get.new(uri.request_uri, header)
	req.basic_auth(api_key, '')
	res = http.start { |http| http.request(req) }
	tbody = JSON.parse(res.body)
	if tbody['errors'] then
		abort("Server returned an error: #{tbody['errors'][0]['message']}")
	end

	tbody['data'].each { |task| 
		task_id = task['id']
		task_name = task['name']
		# 
		# Get task details
		# 
		
		uri = URI.parse("https://app.asana.com/api/1.0/tasks/#{task_id}")
		http = Net::HTTP.new(uri.host, uri.port)
		http.use_ssl = true
		http.verify_mode = OpenSSL::SSL::VERIFY_PEER
		header = {
		  "Content-Type" => "application/json"
		}
		req = Net::HTTP::Get.new(uri.request_uri, header)
		req.basic_auth(api_key, '')
		res = http.start { |http| http.request(req) }
		dbody = JSON.parse(res.body)
		if dbody['errors'] then
			abort("Server returned an error: #{dbody['errors'][0]['message']}")
		end
		tdata = dbody['data']

		if tdata['completed'] == false and tdata['assignee_status'] == qstatus then
			if tdata['parent'] then
				#
				# Get details of parent task
				# 
				
				uri = URI.parse("https://app.asana.com/api/1.0/tasks/#{tdata['parent']['id']}")
				http = Net::HTTP.new(uri.host, uri.port)
				http.use_ssl = true
				http.verify_mode = OpenSSL::SSL::VERIFY_PEER
				header = {
				  "Content-Type" => "application/json"
				}
				req = Net::HTTP::Get.new(uri.request_uri, header)
				req.basic_auth(api_key, '')
				res = http.start { |http| http.request(req) }
				pbody = JSON.parse(res.body)
				if pbody['errors'] then
					abort("Server returned an error: #{pbody['errors'][0]['message']}")
				end
				pdata = pbody['data']

				parent_name = pdata['name']
				if tdata['due_on'] then
					task_due_on = tdada['due_on']
				else
					task_due_on = pdata['due_on']
				end
				task_projects = []
				if pdata['projects'] then
					pdata['projects'].each { |proj|
						task_projects.push(proj['name'])
					}
				end
			else
				parent_name = ""
				task_due_on = tdata['due_on']
				task_projects = []
				if tdata['projects'] then
					tdata['projects'].each { |proj|
						task_projects.push(proj['name'])
					}
				end
			end

			task = {:id => task_id, :name => task_name, :parent => parent_name, :workspace_id => workspace_id, :workspace => workspace_name, :projects => task_projects, :due_on => task_due_on}
			output.push(task)
		end
	}
}

output_main = {:tasks => output}
puts JSON.generate(output_main)
