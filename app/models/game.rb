class Game < ActiveRecord::Base
  serialize :game_data, JSON
  COUNTRIES = ['Brazil', 'China', 'France', 'India', 'Japan', 'Russian Federation', 'United Kingdom', 'USA']
 
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

  def update_income_levels()
    round = self.round
    # PR > 4, change Income +1
    # PR < -1 and PR < -3, change Income -1
    # PR < -3, change Income -2
    Game::COUNTRIES.each do |country|
      pr = PublicRelation.where(round: round).where(country: country).sum(:pr_amount)
      next_income = Income.where(round: round, team_name: country)[0].amount

      if pr >= 4
        next_income += 1
      elsif pr <=-1 and pr >=-3
        next_income += -1
      elsif pr < -3
        next_income += -2
      end
      income = Income.find_or_create_by(round: Game.last.round + 1, team_name: country)
      income.amount = next_income
      income.save()
    end
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
