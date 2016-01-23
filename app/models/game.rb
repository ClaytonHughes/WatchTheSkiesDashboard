class Game < ActiveRecord::Base
  serialize :game_data, JSON
  COUNTRIES = ['BR', 'CN', 'DE', 'FR', 'IN', 'JP', 'RU', 'UK', 'US']
 
  def reset()
    self.name = ""
    self.round = 0
    self.last_time = Time.now()
    self.control_message = "Welcome to Watch the Skies!"
    self.alien_comm = false
    game_data = {}
    game_data['rioters']=0
    game_data['paused']=true
    game_data['alien_comms']=false
    game_data['minutes']=_seconds_from_minutes(45)
    game_data['seconds']=0
    game_data['alliances']={}
    game_data['economy']={}
    self.data = game_data
    self.save()
  end

  def update()
    # real-world time since update last called
    now = Time.now()
    time_delta_s = now - self.last_time
    puts time_delta_s
    self.last_time = now
 
    return _update(time_delta_s)
  end

  def _next_round()
    puts "Round is changing from #{self.round} to #{self.round+1}"
    self.round +=1
  end

  private

  def _update(time_delta_s)
    if not self.data['paused']
      time_left = _get_time_left() - time_delta_s
      if time_left < 0
        _next_round()
        time_left = _seconds_from_minutes(30)
      end
      _set_time_left(time_left)
    end
    self.save()
    return self
  end

  def _get_time_left()
    mins = self.data['minutes']
    secs = self.data['seconds']
    return secs + _seconds_from_minutes(mins)
  end

  def _set_time_left(seconds)
    minutes = (seconds / 60.0).floor
    seconds = seconds % 60
    self.data['minutes'] = minutes
    self.data['seconds'] = seconds
  end

  def _seconds_from_minutes(minutes)
    return minutes * 60
  end

end
