class AddVisibilityToNewsMessages < ActiveRecord::Migration
  def change
    add_column :news_messages, :visible_content, :boolean
    add_column :news_messages, :visible_image, :boolean
  end
end
