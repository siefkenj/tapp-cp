class OffersController < ApplicationController
  protect_from_forgery with: :null_session
  include Mangler

  def index
    render json: get_all_offers
  end

  def show
    offer = Offer.find(params[:id])
    render json: offer.format
  end

  def update
    if params[:id] == "batch-update"
      if params[:offers]
        params[:offers].each do |id|
          offer = Offer.find(id)
          offer.update_attributes!(offer_params)
        end
      else
        render status: 404, json: {message: "Error: No offers given."}
      end
    else
      offer = Offer.find(params[:id])
      offer.update_attributes!(offer_params)
    end
  end

  def send_contracts
    errors = ["Exceptions:"]
    if params[:offers]
      params[:offers].each do |id|
        offer = Offer.find(id)
        if !offer[:send_date]
          if ENV['RAILS_ENV'] != 'test'
            begin
              link = crypt(get_utorid_position(offer.format), id, "view")
              CpMailer.contract_email(offer.format, link).deliver_now
            rescue StandardError => e
              errors.push("Could not send a contract to #{offer[:applicant][:email]}.")
            end
          end
          offer.update_attributes!({status: "Pending", send_date: DateTime.now.to_s})
        else
          errors.push("You've already sent out a contract to #{offer.format[:applicant][:email]}.")
        end
      end
    end
    if errors.length == 1
      render status: 200, json: {message: "You've successfully sent out all the contracts."}
    else
      render status: 404, json: {message: errors.join("\n")}
    end
  end

  def batch_email_nags
    if params[:contracts] && params[:contracts]!=""
      params[:contracts].each do |id|
        offer = Offer.find(id)
        if offer
          offer.increment!(:nag_count, 1)
          if ENV['RAILS_ENV'] != 'test'
            link = crypt(get_utorid_position(offer.format), id, "view")
            CpMailer.nag_email(offer.format, link).deliver_now
          end
        end
      end
      render json: {message: "You've sent the nag emails."}
    end
  end

  def combine_contracts_print
    if params[:contracts] && params[:contracts]!=""
      offers = get_printable_data(params[:contracts])
      if params[:update]
        update_print_status(offers)
      end
      generator = ContractGenerator.new(offers, true)
      send_data generator.render, filename: "contracts.pdf", disposition: "inline"
    end
  end

  def get_contract
    offer = Offer.find(params[:offer_id])
    generator = ContractGenerator.new([offer.format])
    send_data generator.render, filename: "contract.pdf", disposition: "inline"
  end

  def set_status
    status = get_status(params)
    offer = Offer.find(params[:offer_id])
    if offer[:status] == "Pending"
      update_status(offer, status)
      render json: {success: true, status: status[:name].downcase, message: "You've just #{status[:name].downcase} this offer."}
    elsif offer[:status] == "Unsent"
      render status: 404, json: {success: false, message: "You cannot #{status[:action]} an unsent offer."}
    else
      render status: 404, json: {success: false, message: "You cannot reject this offer. This offer has already been #{offer[:status].downcase}."}
    end
  end

  private
  def offer_params
    params.permit(:hr_status, :ddah_status)
  end

  def get_all_offers
    Offer.all.map do |offer|
      offer.format
    end
  end

  def get_printable_data(contracts)
    offers = []
    contracts.each do |id|
      offer = Offer.find(id)
      if offer
        offers.push(offer.format)
      end
    end
    return offers
  end

  def update_print_status(offers)
    offers.each do |offer|
      offer = Offer.find(offer[:id])
      if offer[:hr_status] == "Processed"
        offer.update_attributes!({print_time: DateTime.now})
      else
        offer.update_attributes!({hr_status: "Printed", print_time: DateTime.now})
      end
    end
  end

  def update_status(offer, status)
    if status[:action]=="accept"
      offer.update_attributes!({status: status[:name], signature: status[:signature]})
    else
      offer.update_attributes!({status: status[:name]})
    end
  end

  def get_status(code)
    case params[:code]
    when "accept"
      return {name: "Accepted", action: "accept", signature: params[:signature]}
    when "reject"
      return {name: "Rejected", action: "reject"}
    when "withdraw"
      return {name: "Withdrawn", action: "withdraw"}
    end
  end

  def get_utorid_position(offer)
    {
      utorid: offer[:applicant][:utorid],
      position_id: offer[:position_id],
    }
  end

end
