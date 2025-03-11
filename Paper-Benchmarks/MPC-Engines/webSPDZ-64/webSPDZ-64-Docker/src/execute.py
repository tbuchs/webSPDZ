from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium import webdriver
from selenium.webdriver.common.by import By
import sys, time, re, subprocess

# import os
# os.system('ls -l /home/.cache')

options = FirefoxOptions()
options.add_argument("--headless")
pf = webdriver.FirefoxProfile()
pf.set_preference("network.websocket.allowInsecureFromHTTPS", True)
#pf.set_preference("dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled", True)

pf.update_preferences()
options.set_capability("acceptInsecureCerts",True)
options.binary_location = '/bin/firefox-nightly'
options.profile = pf
# options.executable_path = '/home/.cache/selenium/geckodriver/linux64/0.35.0/geckodriver'

# os.system('ls -l /home/.cache')

# service = webdriver.FirefoxService(log_output=subprocess.STDOUT)
# driver = webdriver.Firefox(options=options, service=service)
driver = webdriver.Firefox(options=options)

# os.system('ls -l /home/.cache')

driver.get(sys.argv[1])

while True:
  time.sleep(5)
  # print("Whole website's HTML Body:\n", driver.find_element(By.XPATH, "/html/body").text)
  value = str(driver.find_element(By.ID, "output").get_attribute("value"))
  # print("...Output Value: ", value)
  if "Finished" in value:
    break
  else:
    time.sleep(1)

driver.quit()
# get timers
timer1 = (value[value.find("Stopped timer 1 at "):]).removeprefix("Stopped timer 1 at ").split(' ', 1)[0]
timer2 = (value[value.find("Stopped timer 2 at "):]).removeprefix("Stopped timer 2 at ").split(' ', 1)[0]
timer3 = (value[value.find("Stopped timer 3 at "):]).removeprefix("Stopped timer 3 at ").split(' ', 1)[0]

# get overall runtime
time = value[value.find("Time = "):]
time = time.removeprefix("Time = ")
time = time[:6]
print(time)

# get result
try:
  result = re.search(r'\n[0-9]+\n', value).group(0).strip()
  print(result)
except:
  result="null"

#print Timers
print("Timer1 (Start-End): ", timer1)
print("Timer2 (Read Inputs): ", timer2)
print("Timer3 (Dot Product): ", timer3)

# print('<b3m4>{"result": %s}</b3m4>' % result)
# print('<b3m4>{"timer": {"full":%s}       }</b3m4>' % timer1)
# print('<b3m4>{"timer": {"input":%s}      }</b3m4>' % timer2)
# print('<b3m4>{"timer": {"inner_prod":%s} }</b3m4>' % timer3)

print('<b3m4>{"result":%s}</b3m4>' % result)
print('<b3m4>{"timer":{"full":%s}}</b3m4>' % timer1)
print('<b3m4>{"timer":{"input":%s}}</b3m4>' % timer2)
print('<b3m4>{"timer":{"inner_prod":%s}}</b3m4>' % timer3)

exit(0)
