import React, { useState } from 'react';
import { Container, Card, Row, Col, Nav, Badge, Accordion } from 'react-bootstrap';
import { Activity, Clock, Heart, Droplet, Wind, Thermometer } from 'react-bootstrap-icons';
import PatientSidebar from '../../components/PatientSidebar';
import Header from '../../components/Header';

const TherapyInfoPage = () => {
  const [activeTherapy, setActiveTherapy] = useState('abhyanga');

  const therapies = {
    abhyanga: {
      name: 'Abhyanga',
      icon: '💆',
      tagline: 'Traditional Ayurvedic Oil Massage',
      duration: '45-60 minutes',
      description: 'Abhyanga is a full-body warm oil massage therapy that nourishes the skin, calms the nervous system, and promotes deep relaxation. Using medicated herbal oils chosen according to your dosha, this therapy improves circulation, removes toxins, and rejuvenates the body.',
      benefits: [
        'Improves blood circulation and lymphatic drainage',
        'Nourishes and moisturizes the skin',
        'Relieves muscle tension and joint stiffness',
        'Promotes better sleep and reduces stress',
        'Strengthens the immune system',
        'Slows down aging process',
        'Improves flexibility and joint mobility'
      ],
      process: [
        'Consultation to determine your dosha type',
        'Selection of appropriate medicated oil',
        'Warm oil application from head to toe',
        'Rhythmic massage strokes following energy channels',
        'Special attention to joints and pressure points',
        'Rest period for oil absorption',
        'Steam bath to enhance benefits'
      ],
      preCare: [
        'Avoid heavy meals 2 hours before',
        'Come with an empty bladder',
        'Inform about any skin conditions',
        'Remove jewelry and contact lenses',
        'Wear comfortable, loose clothing'
      ],
      postCare: [
        'Rest for 30 minutes after therapy',
        'Take warm shower after 2-3 hours',
        'Drink plenty of warm water',
        'Avoid cold foods and beverages',
        'Skip strenuous activities for the day',
        'Apply warm compress if needed'
      ],
      bestFor: ['Vata imbalance', 'Stress and anxiety', 'Dry skin', 'Insomnia', 'Body aches']
    },
    pizhichil: {
      name: 'Pizhichil',
      icon: '🛁',
      tagline: 'Royal Rejuvenation Oil Bath Therapy',
      duration: '60-90 minutes',
      description: 'Known as the "King of Ayurvedic Therapies," Pizhichil involves pouring warm medicated oil over the body in a continuous stream while simultaneously massaging. This luxurious treatment was traditionally reserved for royalty and is highly effective for neurological and rheumatic conditions.',
      benefits: [
        'Deeply relaxes muscles and nerves',
        'Excellent for arthritis and joint pain',
        'Improves skin texture and glow',
        'Enhances immunity and vitality',
        'Relieves chronic fatigue',
        'Beneficial for paralysis and hemiplegia',
        'Slows aging and improves longevity'
      ],
      process: [
        'Patient lies on special droni (wooden bed)',
        'Warm medicated oil is poured continuously',
        'Simultaneous massage by 2-4 therapists',
        'Oil temperature maintained at 40-45°C',
        'Special focus on affected areas',
        'Duration of 45-60 minutes',
        'Followed by steam therapy'
      ],
      preCare: [
        'Light meal 3 hours before',
        'Inform about blood pressure issues',
        'Avoid if you have fever',
        'Remove all jewelry',
        'Empty bladder before treatment'
      ],
      postCare: [
        'Complete rest for 1 hour',
        'Hot water bath after 3-4 hours',
        'Consume warm, light food',
        'Avoid cold exposure',
        'No travel immediately after',
        'Continue for prescribed course'
      ],
      bestFor: ['Arthritis', 'Neurological disorders', 'Anti-aging', 'Paralysis', 'Chronic pain']
    },
    shirodhara: {
      name: 'Shirodhara',
      icon: '🧘',
      tagline: 'Third Eye Oil Pouring Therapy',
      duration: '45-60 minutes',
      description: 'Shirodhara is a divine relaxation therapy where warm medicated oil is poured in a continuous stream on the forehead (third eye area). This deeply calming treatment is excellent for mental stress, insomnia, and anxiety disorders.',
      benefits: [
        'Profound mental relaxation',
        'Reduces stress, anxiety, and depression',
        'Improves sleep quality',
        'Enhances memory and concentration',
        'Relieves headaches and migraines',
        'Balances emotions and mood',
        'Awakens intuition and clarity'
      ],
      process: [
        'Patient lies comfortably on massage table',
        'Eyes covered with cotton pads',
        'Warm oil poured on forehead center',
        'Continuous stream for 30-45 minutes',
        'Gentle scalp massage included',
        'Oil allowed to flow through hair',
        'Rest period after treatment'
      ],
      preCare: [
        'Light meal recommended',
        'Avoid caffeine before session',
        'Remove eye makeup',
        'Inform about scalp conditions',
        'Come relaxed and calm'
      ],
      postCare: [
        'Rest with eyes closed for 15 minutes',
        'Keep head covered outdoors',
        'Wash hair after 2-3 hours',
        'Avoid screens for 2 hours',
        'Practice meditation if possible',
        'Sleep well at night'
      ],
      bestFor: ['Insomnia', 'Anxiety', 'Migraines', 'Mental fatigue', 'PTSD', 'Hypertension']
    },
    swedana: {
      name: 'Swedana',
      icon: '♨️',
      tagline: 'Herbal Steam Therapy',
      duration: '15-30 minutes',
      description: 'Swedana is a therapeutic steam bath using herbal decoctions. The steam opens pores, induces sweating, and helps eliminate toxins (ama) from the body. Often performed after oil massage to enhance benefits.',
      benefits: [
        'Deep detoxification through sweating',
        'Improves skin health and complexion',
        'Relieves stiffness and body aches',
        'Opens respiratory passages',
        'Enhances metabolism',
        'Reduces water retention',
        'Promotes weight loss'
      ],
      process: [
        'Steam chamber with herbal decoctions',
        'Head kept outside for safety',
        'Gradual temperature increase',
        'Duration of 10-20 minutes',
        'Monitored by therapist',
        'Followed by cool down period',
        'Shower with lukewarm water'
      ],
      preCare: [
        'Hydrate well before session',
        'Avoid if you have heart conditions',
        'Empty stomach preferred',
        'Inform about blood pressure',
        'Remove all metal jewelry'
      ],
      postCare: [
        'Rest for 20 minutes',
        'Drink herbal tea or warm water',
        'Take lukewarm shower',
        'Avoid cold environments',
        'Eat light, warm food',
        'Stay hydrated throughout day'
      ],
      bestFor: ['Detoxification', 'Weight loss', 'Skin problems', 'Respiratory issues', 'Arthritis']
    },
    udvartana: {
      name: 'Udvartana',
      icon: '✨',
      tagline: 'Herbal Powder Massage',
      duration: '30-45 minutes',
      description: 'Udvartana is an invigorating dry powder massage using specially prepared herbal powders. This therapy is excellent for weight reduction, cellulite removal, and improving skin tone and texture.',
      benefits: [
        'Reduces excess fat and cellulite',
        'Improves skin tone and texture',
        'Stimulates blood circulation',
        'Exfoliates dead skin cells',
        'Enhances metabolism',
        'Reduces cholesterol levels',
        'Tones muscles and firms skin'
      ],
      process: [
        'Selection of appropriate herbal powder',
        'Upward massage strokes (against hair growth)',
        'Vigorous rubbing technique',
        'Special focus on problem areas',
        'Duration of 30-40 minutes',
        'Rest period',
        'Warm water shower'
      ],
      preCare: [
        'Hydrate well',
        'Avoid if skin is sensitive',
        'Light meal recommended',
        'Inform about allergies',
        'Come with dry skin'
      ],
      postCare: [
        'Shower with warm water only',
        'Apply light moisturizer',
        'Drink warm water',
        'Avoid oily foods',
        'Continue for prescribed course',
        'Regular exercise recommended'
      ],
      bestFor: ['Weight loss', 'Obesity', 'Cellulite', 'Skin disorders', 'Poor circulation']
    },
    nasya: {
      name: 'Nasya',
      icon: '👃',
      tagline: 'Nasal Administration Therapy',
      duration: '15-30 minutes',
      description: 'Nasya involves administering medicated oils or herbal preparations through the nasal passages. This therapy is highly effective for disorders of the head, neck, and upper respiratory system.',
      benefits: [
        'Clears sinuses and nasal passages',
        'Relieves headaches and migraines',
        'Improves voice quality',
        'Enhances mental clarity',
        'Prevents hair fall and premature graying',
        'Strengthens neck and shoulders',
        'Improves sense of smell'
      ],
      process: [
        'Face and head massage with oil',
        'Steam inhalation to open passages',
        'Patient lies with head tilted back',
        'Medicated oil drops in each nostril',
        'Gentle massage of nasal bridge',
        'Patient inhales the medicine',
        'Rest period with head elevated'
      ],
      preCare: [
        'Empty stomach or light meal',
        'Avoid if you have cold or fever',
        'No alcohol 24 hours before',
        'Remove nasal jewelry',
        'Blow nose to clear passages'
      ],
      postCare: [
        'Rest with head elevated',
        'Avoid bathing for 2 hours',
        'Gargle with warm water',
        'Avoid cold foods and drinks',
        'No smoking or alcohol',
        'Avoid dust and pollutants'
      ],
      bestFor: ['Sinusitis', 'Migraines', 'Allergic rhinitis', 'Cervical spondylosis', 'Hair loss']
    }
  };

  const currentTherapy = therapies[activeTherapy];

  return (
    <div className="d-flex">
      <PatientSidebar />
      <div className="flex-grow-1 bg-light" style={{ minHeight: '100vh', marginLeft: '250px' }}>
        <Header title="Therapy Information Center" />
        <Container className="py-4">
          {/* Header Card */}
          <Card className="mb-4 shadow-sm border-0 rounded-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Card.Body className="text-white text-center py-5">
              <h2 className="fw-bold mb-3">🌿 Ayurvedic Therapy Guide</h2>
              <p className="mb-0 fs-5">
                Explore traditional healing therapies designed to restore balance and promote wellness
              </p>
            </Card.Body>
          </Card>

          {/* Therapy Navigation */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Nav variant="pills" className="flex-row" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                {Object.keys(therapies).map((key) => (
                  <Nav.Item key={key}>
                    <Nav.Link
                      active={activeTherapy === key}
                      onClick={() => setActiveTherapy(key)}
                      className="text-nowrap"
                      style={{
                        fontSize: '1.1rem',
                        padding: '12px 24px',
                        margin: '0 5px'
                      }}
                    >
                      {therapies[key].icon} {therapies[key].name}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </Card.Body>
          </Card>

          {/* Therapy Details */}
          <Row>
            <Col lg={8}>
              {/* Main Info Card */}
              <Card className="mb-4 shadow-sm border-0 rounded-4">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <h1 style={{ fontSize: '4rem' }}>{currentTherapy.icon}</h1>
                    <h2 className="text-success fw-bold">{currentTherapy.name}</h2>
                    <p className="text-muted fs-5">{currentTherapy.tagline}</p>
                    <Badge bg="success" className="fs-6 px-3 py-2">
                      <Clock size={16} className="me-2" />
                      {currentTherapy.duration}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="text-success mb-3">📖 About This Therapy</h5>
                    <p style={{ lineHeight: '1.8', fontSize: '1.05rem' }}>
                      {currentTherapy.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-success mb-3">✨ Health Benefits</h5>
                    <Row>
                      {currentTherapy.benefits.map((benefit, idx) => (
                        <Col md={6} key={idx} className="mb-2">
                          <div className="d-flex align-items-start">
                            <span className="text-success me-2">✓</span>
                            <span>{benefit}</span>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-success mb-3">🔄 Treatment Process</h5>
                    <Accordion>
                      {currentTherapy.process.map((step, idx) => (
                        <Accordion.Item eventKey={idx.toString()} key={idx}>
                          <Accordion.Header>
                            <Badge bg="success" className="me-2">{idx + 1}</Badge>
                            {step.split(':')[0]}
                          </Accordion.Header>
                          <Accordion.Body>{step}</Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Quick Info Cards */}
              <Card className="mb-3 shadow-sm border-0 rounded-4 border-start border-4 border-warning">
                <Card.Body>
                  <h6 className="text-warning mb-3">⚠️ Before Treatment</h6>
                  <ul className="mb-0" style={{ paddingLeft: '20px' }}>
                    {currentTherapy.preCare.map((item, idx) => (
                      <li key={idx} className="mb-2">{item}</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>

              <Card className="mb-3 shadow-sm border-0 rounded-4 border-start border-4 border-success">
                <Card.Body>
                  <h6 className="text-success mb-3">✅ After Treatment</h6>
                  <ul className="mb-0" style={{ paddingLeft: '20px' }}>
                    {currentTherapy.postCare.map((item, idx) => (
                      <li key={idx} className="mb-2">{item}</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>

              <Card className="mb-3 shadow-sm border-0 rounded-4 border-start border-4 border-info">
                <Card.Body>
                  <h6 className="text-info mb-3">🎯 Best Suited For</h6>
                  {currentTherapy.bestFor.map((condition, idx) => (
                    <Badge key={idx} bg="info" className="me-2 mb-2 px-3 py-2">
                      {condition}
                    </Badge>
                  ))}
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0 rounded-4 bg-success text-white">
                <Card.Body className="text-center">
                  <h6 className="mb-3">📅 Book Your Session</h6>
                  <p className="small mb-3">
                    Interested in this therapy? Contact our wellness center to schedule your appointment.
                  </p>
                  <p className="mb-0 fw-bold">
                    📞 +91 1234567890<br />
                    📧 info@ayushwellness.com
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Disclaimer */}
          <Card className="mt-4 shadow-sm border-0 rounded-4 bg-light">
            <Card.Body>
              <p className="text-muted text-center mb-0 small">
                <strong>Disclaimer:</strong> This information is for educational purposes only. Please consult with our Ayurvedic practitioners for personalized treatment recommendations. Individual results may vary based on your unique constitution (Prakriti) and current health status.
              </p>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default TherapyInfoPage;